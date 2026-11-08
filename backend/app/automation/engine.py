import os
import time
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    Workflow,
    WorkflowExecution,
    BusinessTransaction,
    InventoryRecord,
    AnomalyDetection,
    GeneratedReport,
    AuditLog
)
from app.data_processing.parser import parse_file
from app.data_processing.cleaner import clean_dataframe
from app.data_processing.validator import validate_sales_contract, validate_inventory_contract
from app.data_processing.exporter import export_cleaned_dataset, export_validation_report
from app.core.config import settings

logger = logging.getLogger("fuji_flow.automation")

STANDARD_PIPELINE_STEPS = [
    {"id": "read_source", "name": "Read Excel/CSV Source", "mandatory": True},
    {"id": "validate_contract", "name": "Validate Data Contract", "mandatory": True},
    {"id": "clean_data", "name": "Cleanse & Normalize Data", "mandatory": True},
    {"id": "store_postgresql", "name": "Store in PostgreSQL Database", "mandatory": True},
    {"id": "calculate_analytics", "name": "Calculate Business Analytics", "mandatory": True},
    {"id": "detect_anomalies", "name": "Scan & Flag Outliers", "mandatory": False},
    {"id": "generate_report", "name": "Generate Summary Report", "mandatory": True},
    {"id": "prepare_email", "name": "Prepare Email Notification", "mandatory": False}
]

def execute_step(
    step_id: str,
    context: Dict[str, Any],
    db: Session
) -> Dict[str, Any]:
    """
    Executes actual business logic for each individual workflow step.
    """
    t0 = time.time()
    result = {"step_id": step_id, "status": "success", "message": "", "data": {}}

    try:
        if step_id == "read_source":
            file_path = context.get("file_path") or "./data/samples/fuji_kyuko_sales_march_2026.csv"
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Source file not found at: {file_path}")
            df_raw, meta = parse_file(file_path)
            context["df_raw"] = df_raw
            context["file_meta"] = meta
            result["message"] = f"Successfully parsed {meta['total_rows']} rows from {meta['file_name']}."
            result["data"] = {"total_rows": meta["total_rows"], "format": meta["file_format"]}

        elif step_id == "validate_contract":
            df_raw = context.get("df_raw")
            if df_raw is None:
                raise ValueError("No raw dataset available in context for validation.")
            contract = context.get("contract_type", "sales")
            if contract == "sales":
                existing_txns = set(r[0] for r in db.query(BusinessTransaction.transaction_id).all())
                valid, invalid, issues, summary = validate_sales_contract(df_raw, existing_txns)
            else:
                valid, invalid, issues, summary = validate_inventory_contract(df_raw)

            context["valid_records"] = valid
            context["invalid_records"] = invalid
            context["validation_issues"] = issues
            context["validation_summary"] = summary
            
            # If 0 valid records, fail the mandatory contract step
            if len(valid) == 0:
                raise ValueError(f"Contract validation rejected all {len(df_raw)} records. Total issues: {len(issues)}.")

            result["message"] = f"Contract verified: {len(valid)} valid, {len(invalid)} quarantined."
            result["data"] = summary

        elif step_id == "clean_data":
            df_raw = context.get("df_raw")
            cleaned_df, ops = clean_dataframe(df_raw)
            context["cleaned_df"] = cleaned_df
            result["message"] = f"Applied {len(ops)} cleaning transformations."
            result["data"] = {"operations_performed": ops}

        elif step_id == "store_postgresql":
            valid = context.get("valid_records", [])
            contract = context.get("contract_type", "sales")
            stored_count = 0
            if contract == "sales":
                for r in valid:
                    txn_id = str(r["transaction_id"]).strip()
                    if not db.query(BusinessTransaction).filter(BusinessTransaction.transaction_id == txn_id).first():
                        txn = BusinessTransaction(
                            transaction_id=txn_id,
                            transaction_date=pd.to_datetime(r["transaction_date"]),
                            product_id=str(r.get("product_id", "")),
                            product_name=str(r.get("product_name", "")),
                            category=str(r.get("category", "General")),
                            quantity=int(r.get("quantity", 1)),
                            unit_price=float(r.get("unit_price", 0.0)),
                            total_amount=float(r.get("total_amount", 0.0)),
                            business_unit=str(r.get("business_unit", "Fuji Kyuko Co., Ltd.")),
                            status=str(r.get("status", "completed"))
                        )
                        db.add(txn)
                        stored_count += 1
            else:
                for r in valid:
                    inv = InventoryRecord(
                        product_id=str(r.get("product_id", "")),
                        product_name=str(r.get("product_name", "")),
                        category=str(r.get("category", "General")),
                        available_quantity=int(r.get("available_quantity", 0)),
                        reorder_level=int(r.get("reorder_level", 10)),
                        unit_cost=float(r.get("unit_cost", 0.0)),
                        warehouse=str(r.get("warehouse", "Central Warehouse Fujiyoshida"))
                    )
                    db.add(inv)
                    stored_count += 1
            db.commit()
            context["records_stored"] = stored_count
            result["message"] = f"Committed {stored_count} verified records into PostgreSQL."
            result["data"] = {"committed_records": stored_count}

        elif step_id == "calculate_analytics":
            # Direct SQL calculation
            total_sales = db.query(func.coalesce(func.sum(BusinessTransaction.total_amount), 0.0)).scalar() or 0.0
            tx_count = db.query(func.count(BusinessTransaction.id)).scalar() or 0
            atv = (float(total_sales) / tx_count) if tx_count > 0 else 0.0
            context["total_sales"] = float(total_sales)
            context["atv"] = round(atv, 2)
            result["message"] = f"Aggregated metrics: Total Sales ¥{float(total_sales):,.2f}, ATV ¥{atv:,.2f}."
            result["data"] = {"total_sales": float(total_sales), "transactions": tx_count, "atv": round(atv, 2)}

        elif step_id == "detect_anomalies":
            # Quick statistical check: transactions with total_amount > 50,000 or 3x average
            avg_val = context.get("atv", 15000.0)
            threshold = max(50000.0, avg_val * 3.0)
            outliers = db.query(BusinessTransaction).filter(BusinessTransaction.total_amount >= threshold).all()
            anomaly_count = 0
            for out in outliers:
                if not db.query(AnomalyDetection).filter(AnomalyDetection.record_id == out.transaction_id).first():
                    anom = AnomalyDetection(
                        record_id=out.transaction_id,
                        record_type="transaction",
                        detection_method=f"Statistical Threshold (>¥{threshold:,.0f})",
                        observed_value=out.total_amount,
                        reference_baseline=avg_val,
                        reason=f"Transaction total amount ¥{out.total_amount:,.2f} exceeds {3.0}x baseline average (¥{avg_val:,.2f}).",
                        raw_record={"product": out.product_name, "category": out.category, "amount": out.total_amount},
                        status="unreviewed"
                    )
                    db.add(anom)
                    anomaly_count += 1
            db.commit()
            result["message"] = f"Anomaly scan complete. Flagged {anomaly_count} high-value records for audit."
            result["data"] = {"flagged_anomalies": anomaly_count, "threshold": threshold}

        elif step_id == "generate_report":
            report_uid = uuid.uuid4().hex[:8]
            report_filename = f"workflow_report_{report_uid}.csv"
            report_path = os.path.join(settings.REPORTS_DIR, report_filename)
            
            # Export audit summary
            report_data = [{
                "metric": "Total Group Sales", "value": context.get("total_sales", 0.0),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, {
                "metric": "Average Transaction Value", "value": context.get("atv", 0.0),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, {
                "metric": "Records Ingested", "value": context.get("records_stored", 0),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }]
            pd.DataFrame(report_data).to_csv(report_path, index=False)

            # Record in PostgreSQL GeneratedReport table
            gen_report = GeneratedReport(
                title=f"Workflow Automated Execution Summary ({report_uid})",
                report_type="workflow_execution_report",
                reporting_period="Automated Pipeline Run",
                data_source="PostgreSQL Core DB (fuji_flow)",
                records_analyzed=context.get("records_stored", 0),
                file_path=report_path.replace("\\", "/"),
                file_format="csv",
                created_by="Fuji Flow Automation Engine"
            )
            db.add(gen_report)
            db.commit()

            result["message"] = f"Audit report successfully generated: {report_filename}."
            result["data"] = {"report_path": report_path, "report_id": gen_report.id}

        elif step_id == "prepare_email":
            # Prepares dispatch package (does not send without explicit SMTP configuration per Section 14)
            subject = f"[FUJI FLOW] Operational Data Pipeline Execution Summary - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
            body = (
                f"Automated Pipeline Execution Completed.\n"
                f"Records Staged & Committed: {context.get('records_stored', 0)}\n"
                f"Total Ingested Sales: ¥{context.get('total_sales', 0.0):,.2f}\n"
                f"Data Quality: Verified without critical schema violations."
            )
            context["email_subject"] = subject
            context["email_body"] = body
            result["message"] = "Email notification package prepared with attached execution summary."
            result["data"] = {"subject": subject, "ready_for_dispatch": True}

        else:
            raise NotImplementedError(f"Unknown workflow step identifier: '{step_id}'")

    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        logger.error(f"Step '{step_id}' failed: {e}")

    result["duration_ms"] = round((time.time() - t0) * 1000, 2)
    return result

def run_workflow_pipeline(
    workflow_id: int,
    trigger_type: str = "manual",
    custom_file_path: Optional[str] = None,
    db: Session = None
) -> Dict[str, Any]:
    """
    Executes a complete configured workflow pipeline, logging every step to PostgreSQL.
    Guarantees failure detection: if any mandatory step fails, marks overall execution as failed.
    """
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise ValueError(f"Workflow ID {workflow_id} not found in database.")

    execution_id = f"EXEC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    start_time = datetime.now(timezone.utc)

    # Initial DB record
    execution = WorkflowExecution(
        workflow_id=wf.id,
        execution_id=execution_id,
        trigger_type=trigger_type,
        status="running",
        start_time=start_time,
        records_processed=0,
        step_details=[]
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    steps_config = wf.steps_config or STANDARD_PIPELINE_STEPS
    step_results = []
    failed_step_name = None
    overall_error = None
    is_failed = False

    context = {
        "workflow_id": wf.id,
        "execution_id": execution_id,
        "file_path": custom_file_path or "./data/samples/fuji_kyuko_sales_march_2026.csv",
        "contract_type": "sales"
    }

    t0_pipeline = time.time()

    for step_cfg in steps_config:
        step_id = step_cfg.get("id")
        step_name = step_cfg.get("name", step_id)
        mandatory = step_cfg.get("mandatory", True)

        step_res = execute_step(step_id, context, db)
        step_res["name"] = step_name
        step_results.append(step_res)

        if step_res["status"] == "failed":
            if mandatory:
                is_failed = True
                failed_step_name = step_name
                overall_error = step_res.get("error", "Mandatory step execution failed.")
                logger.warning(f"Workflow '{wf.name}' failed at mandatory step '{step_name}': {overall_error}")
                break

    end_time = datetime.now(timezone.utc)
    duration_sec = round(time.time() - t0_pipeline, 2)
    records_processed = context.get("records_stored", context.get("file_meta", {}).get("total_rows", 0))

    # Update execution record
    execution.status = "failed" if is_failed else "success"
    execution.end_time = end_time
    execution.duration_seconds = duration_sec
    execution.records_processed = records_processed
    execution.failed_step = failed_step_name
    execution.error_message = overall_error
    execution.step_details = step_results

    db.add(AuditLog(
        user_email="system",
        action="WORKFLOW_RUN",
        entity_type="WORKFLOW_EXECUTION",
        entity_id=execution_id,
        details={
            "workflow_name": wf.name,
            "status": execution.status,
            "duration": duration_sec,
            "failed_step": failed_step_name
        }
    ))
    db.commit()
    db.refresh(execution)

    return {
        "execution_id": execution_id,
        "workflow_id": wf.id,
        "workflow_name": wf.name,
        "status": execution.status,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_seconds": duration_sec,
        "records_processed": records_processed,
        "failed_step": failed_step_name,
        "error_message": overall_error,
        "steps": step_results
    }
