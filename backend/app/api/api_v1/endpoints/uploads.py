import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Literal
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    DataImport,
    ValidationIssue,
    BusinessTransaction,
    InventoryRecord,
    AuditLog
)
from app.api.deps import get_current_user
from app.core.config import settings
from app.data_processing.parser import parse_file, MAX_FILE_SIZE_BYTES
from app.data_processing.cleaner import clean_dataframe
from app.data_processing.validator import validate_sales_contract, validate_inventory_contract
from app.data_processing.exporter import export_validation_report, export_cleaned_dataset
import pandas as pd

router = APIRouter()

@router.get("/samples")
def get_sample_datasets():
    """Returns available realistic Fuji Kyuko sample datasets."""
    samples_dir = "./data/samples"
    available = []
    if os.path.exists(samples_dir):
        for f in os.listdir(samples_dir):
            if f.endswith((".csv", ".xlsx", ".json")):
                p = os.path.join(samples_dir, f)
                available.append({
                    "name": f,
                    "path": p.replace("\\", "/"),
                    "size_bytes": os.path.getsize(p),
                    "description": "Fuji Kyuko Official Operational Sample Dataset"
                })
    return available

@router.post("/preview")
async def preview_uploaded_file(
    file: Optional[UploadFile] = File(None),
    sample_path: Optional[str] = Form(None),
    _current_user = Depends(get_current_user)
):
    """
    Step 1 & 2: Reads file, detects format, inspects columns and types,
    returns metadata and preview rows without persisting to DB yet.
    """
    temp_dir = os.path.join(settings.UPLOAD_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)

    if sample_path:
        if not os.path.exists(sample_path):
            raise HTTPException(status_code=404, detail=f"Sample file not found at {sample_path}")
        target_path = sample_path
        filename = os.path.basename(sample_path)
    elif file:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".csv", ".xlsx", ".xls", ".json"]:
            raise HTTPException(status_code=400, detail="Unsupported format. Only CSV, XLSX, XLS, and JSON are supported.")

        unique_id = uuid.uuid4().hex[:8]
        target_path = os.path.join(temp_dir, f"{unique_id}_{filename}")
        with open(target_path, "wb") as f_out:
            shutil.copyfileobj(file.file, f_out)
    else:
        raise HTTPException(status_code=400, detail="Either a file upload or sample_path must be provided.")

    try:
        df, metadata = parse_file(target_path)
        metadata["temp_file_path"] = target_path.replace("\\", "/")
        return metadata
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

@router.post("/clean-and-validate")
async def clean_and_validate_file(
    file_path: str = Form(...),
    contract_type: Literal["sales", "inventory"] = Form("sales"),
    column_mapping: Optional[str] = Form(None),  # JSON string
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Step 3, 4, 5: Cleans dataset, enforces business contracts, flags mathematical mismatches,
    and registers an audit-tracked DataImport entry in PostgreSQL.
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Staged file not found.")

    mapping_dict = {}
    if column_mapping:
        import json
        try:
            mapping_dict = json.loads(column_mapping)
        except Exception:
            pass

    # 1. Parse raw file
    df_raw, meta = parse_file(file_path)

    # 2. Clean dataset
    cleaned_df, cleaning_ops = clean_dataframe(df_raw, mapping_dict)

    # 3. Validate against contract
    if contract_type == "sales":
        # Query existing transaction IDs in DB to prevent duplicates
        existing_txns = set(r[0] for r in db.query(BusinessTransaction.transaction_id).all())
        valid_records, invalid_records, issues, summary = validate_sales_contract(cleaned_df, existing_txns)
    else:
        valid_records, invalid_records, issues, summary = validate_inventory_contract(cleaned_df)

    # 4. Save raw file permanently to ./data/raw/
    import_uid = uuid.uuid4().hex[:8]
    filename = os.path.basename(file_path)
    raw_save_path = os.path.join(settings.RAW_DIR, f"{import_uid}_{filename}")
    shutil.copyfile(file_path, raw_save_path)

    # 5. Export cleaned dataset to ./data/processed/
    cleaned_save_path = os.path.join(settings.PROCESSED_DIR, f"cleaned_{import_uid}.csv")
    export_cleaned_dataset(valid_records, cleaned_save_path)

    # 6. Export validation report to ./data/reports/
    report_save_path = os.path.join(settings.REPORTS_DIR, f"validation_report_{import_uid}.csv")
    export_validation_report(issues, report_save_path)

    # 7. Record in PostgreSQL DataImport table
    data_import = DataImport(
        file_name=filename,
        file_format=meta["file_format"],
        file_size_bytes=meta["file_size_bytes"],
        status="validated",
        total_records=summary["total_records"],
        valid_records=summary["valid_records"],
        invalid_records=summary["invalid_records"],
        raw_file_path=raw_save_path.replace("\\", "/"),
        cleaned_file_path=cleaned_save_path.replace("\\", "/"),
        user_id=current_user.id
    )
    db.add(data_import)
    db.flush()

    # Store validation issues in PostgreSQL
    for iss in issues:
        v_issue = ValidationIssue(
            import_id=data_import.id,
            row_number=iss["row_number"],
            field_name=iss["field_name"],
            invalid_value=iss["invalid_value"],
            error_message=iss["error_message"],
            severity=iss["severity"]
        )
        db.add(v_issue)

    # Audit log
    db.add(AuditLog(
        user_email=current_user.email,
        action="DATA_VALIDATION",
        entity_type="DATA_IMPORT",
        entity_id=str(data_import.id),
        details={
            "file": filename,
            "contract": contract_type,
            "total": summary["total_records"],
            "valid": summary["valid_records"],
            "invalid": summary["invalid_records"]
        }
    ))
    db.commit()
    db.refresh(data_import)

    return {
        "import_id": data_import.id,
        "summary": summary,
        "cleaning_operations": cleaning_ops,
        "valid_preview": valid_records[:20],
        "invalid_records": invalid_records,
        "issues": issues,
        "report_url": f"/api/v1/uploads/{data_import.id}/report",
        "cleaned_file_url": f"/api/v1/uploads/{data_import.id}/cleaned-file"
    }

@router.post("/{import_id}/confirm")
def confirm_import_to_database(
    import_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Step 6: Commits validated records into the primary PostgreSQL business tables.
    Never silently discards invalid rows.
    """
    data_import = db.query(DataImport).filter(DataImport.id == import_id).first()
    if not data_import:
        raise HTTPException(status_code=404, detail="Data import record not found.")

    if data_import.status == "imported":
        return {
            "status": "already_imported",
            "message": "This dataset has already been successfully committed to PostgreSQL.",
            "records_imported": data_import.valid_records
        }

    cleaned_path = data_import.cleaned_file_path
    if not cleaned_path or not os.path.exists(cleaned_path):
        raise HTTPException(status_code=400, detail="Cleaned dataset file is missing on server.")

    df_cleaned = pd.read_csv(cleaned_path)
    records_added = 0

    # Determine table target based on columns
    if "transaction_id" in df_cleaned.columns:
        # Sales Transactions
        for _, row in df_cleaned.iterrows():
            txn_id = str(row["transaction_id"]).strip()
            # Double check existence to prevent race condition
            exists = db.query(BusinessTransaction).filter(BusinessTransaction.transaction_id == txn_id).first()
            if not exists:
                txn = BusinessTransaction(
                    transaction_id=txn_id,
                    transaction_date=pd.to_datetime(row["transaction_date"]),
                    product_id=str(row.get("product_id", "")),
                    product_name=str(row.get("product_name", "")),
                    category=str(row.get("category", "General")),
                    quantity=int(row.get("quantity", 1)),
                    unit_price=float(row.get("unit_price", 0.0)),
                    total_amount=float(row.get("total_amount", 0.0)),
                    business_unit=str(row.get("business_unit", "Fuji Kyuko Co., Ltd.")),
                    status=str(row.get("status", "completed")),
                    import_id=data_import.id
                )
                db.add(txn)
                records_added += 1
    elif "available_quantity" in df_cleaned.columns:
        # Inventory Records
        for _, row in df_cleaned.iterrows():
            inv = InventoryRecord(
                product_id=str(row.get("product_id", "")),
                product_name=str(row.get("product_name", "")),
                category=str(row.get("category", "General")),
                available_quantity=int(row.get("available_quantity", 0)),
                reorder_level=int(row.get("reorder_level", 10)),
                unit_cost=float(row.get("unit_cost", 0.0)),
                warehouse=str(row.get("warehouse", "Central Warehouse Fujiyoshida")),
                import_id=data_import.id
            )
            db.add(inv)
            records_added += 1

    data_import.status = "imported"
    db.add(AuditLog(
        user_email=current_user.email,
        action="CONFIRM_IMPORT",
        entity_type="DATA_IMPORT",
        entity_id=str(data_import.id),
        details={"records_committed": records_added}
    ))
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully stored {records_added} validated records into PostgreSQL core tables.",
        "import_id": data_import.id,
        "records_imported": records_added,
        "invalid_records_held": data_import.invalid_records
    }

@router.get("/history")
def get_import_history(
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """Returns past file imports with provenance and validation status."""
    imports = db.query(DataImport).order_by(DataImport.created_at.desc()).all()
    history = []
    for imp in imports:
        history.append({
            "id": imp.id,
            "file_name": imp.file_name,
            "file_format": imp.file_format,
            "file_size_bytes": imp.file_size_bytes,
            "status": imp.status,
            "total_records": imp.total_records,
            "valid_records": imp.valid_records,
            "invalid_records": imp.invalid_records,
            "uploaded_by": imp.uploaded_by_user.email if imp.uploaded_by_user else "System",
            "created_at": imp.created_at.isoformat() if imp.created_at else None,
            "has_report": imp.invalid_records > 0
        })
    return history

@router.get("/{import_id}/report")
def download_validation_report(
    import_id: int,
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """Downloads audit CSV report detailing all validation errors and math formula flags."""
    imp = db.query(DataImport).filter(DataImport.id == import_id).first()
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")

    report_path = os.path.join(settings.REPORTS_DIR, f"validation_report_{imp.id}.csv")
    if not os.path.exists(report_path):
        # Generate on the fly from PostgreSQL validation_issues table
        issues = db.query(ValidationIssue).filter(ValidationIssue.import_id == import_id).all()
        issue_dicts = [{
            "row_number": i.row_number,
            "field_name": i.field_name,
            "invalid_value": i.invalid_value,
            "error_message": i.error_message,
            "severity": i.severity
        } for i in issues]
        export_validation_report(issue_dicts, report_path)

    return FileResponse(
        report_path,
        media_type="text/csv",
        filename=f"validation_report_{imp.file_name}.csv"
    )

@router.get("/{import_id}/cleaned-file")
def download_cleaned_file(
    import_id: int,
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """Downloads cleaned and verified CSV dataset."""
    imp = db.query(DataImport).filter(DataImport.id == import_id).first()
    if not imp or not imp.cleaned_file_path or not os.path.exists(imp.cleaned_file_path):
        raise HTTPException(status_code=404, detail="Cleaned file not found.")

    return FileResponse(
        imp.cleaned_file_path,
        media_type="text/csv",
        filename=f"cleaned_{imp.file_name}.csv"
    )
