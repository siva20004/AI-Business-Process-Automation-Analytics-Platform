import os
import pytest
import pandas as pd
from app.data_processing.parser import parse_file
from app.data_processing.cleaner import clean_dataframe
from app.data_processing.validator import validate_sales_contract, validate_inventory_contract
from app.database.session import SessionLocal
from app.models import BusinessTransaction, DataImport, ValidationIssue

def test_parse_sample_csv():
    sample_csv = "data/samples/fuji_kyuko_sales_march_2026.csv"
    assert os.path.exists(sample_csv)
    df, meta = parse_file(sample_csv)
    assert meta["total_rows"] == 23
    assert meta["file_format"] == "csv"
    assert len(meta["columns"]) >= 7

def test_parse_sample_excel():
    sample_xlsx = "data/samples/fuji_kyuko_inventory_2026.xlsx"
    assert os.path.exists(sample_xlsx)
    df, meta = parse_file(sample_xlsx)
    assert meta["total_rows"] == 8
    assert meta["file_format"] == "xlsx"
    assert "available_quantity" in [c["name"] for c in meta["columns"]]

def test_cleaning_and_validation_sales_contract():
    sample_csv = "data/samples/fuji_kyuko_sales_march_2026.csv"
    df_raw, _ = parse_file(sample_csv)
    cleaned_df, ops = clean_dataframe(df_raw)
    
    assert len(ops) > 0
    valid, invalid, issues, summary = validate_sales_contract(cleaned_df)
    
    # In the sample dataset we intentionally included 3 errors:
    # 1. Duplicate ID TXN-20260301-001
    # 2. Math calculation mismatch: quantity 3 * 1800 != 4500
    # 3. Invalid quantity 0
    assert summary["invalid_records"] == 3
    assert summary["valid_records"] == 20
    assert summary["duplicate_records"] >= 1
    assert summary["math_mismatches"] >= 1
    
    # Check that math mismatch has proposed correction
    math_issue = next(i for i in issues if "Formula mismatch" in i["error_message"])
    assert math_issue["proposed_correction"] == "5400.0"

def test_api_upload_preview_and_validate(client, auth_headers):
    # Clear previously committed test transactions for reproducible idempotent test run
    db = SessionLocal()
    db.query(ValidationIssue).delete()
    db.query(BusinessTransaction).filter(BusinessTransaction.transaction_id.like("TXN-%")).delete()
    db.query(DataImport).delete()
    db.commit()
    db.close()

    sample_csv = "data/samples/fuji_kyuko_sales_march_2026.csv"
    
    # 1. Preview
    res_preview = client.post(
        "/api/v1/uploads/preview",
        data={"sample_path": sample_csv},
        headers=auth_headers
    )
    assert res_preview.status_code == 200
    meta = res_preview.json()
    assert meta["total_rows"] == 23
    
    # 2. Clean and Validate
    res_val = client.post(
        "/api/v1/uploads/clean-and-validate",
        data={
            "file_path": meta["temp_file_path"],
            "contract_type": "sales"
        },
        headers=auth_headers
    )
    assert res_val.status_code == 200
    val_data = res_val.json()
    assert val_data["summary"]["valid_records"] == 20
    assert val_data["summary"]["invalid_records"] == 3
    import_id = val_data["import_id"]
    
    # 3. Confirm and commit to PostgreSQL
    res_confirm = client.post(
        f"/api/v1/uploads/{import_id}/confirm",
        headers=auth_headers
    )
    assert res_confirm.status_code == 200
    assert res_confirm.json()["status"] == "success"
    assert res_confirm.json()["records_imported"] == 20
    
    # 4. Verify Dashboard now shows REAL DATA from PostgreSQL!
    res_dash = client.get("/api/v1/dashboard/summary?time_range=all", headers=auth_headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["kpis"]["has_real_data"] is True
    assert dash_data["kpis"]["total_transactions"] >= 20
    assert dash_data["kpis"]["total_sales"] > 0
    assert len(dash_data["sales_trends"]) > 0
    assert len(dash_data["category_performance"]) > 0
    
    # 5. Verify validation report download
    res_rep = client.get(f"/api/v1/uploads/{import_id}/report", headers=auth_headers)
    assert res_rep.status_code == 200
    assert "text/csv" in res_rep.headers["content-type"]
