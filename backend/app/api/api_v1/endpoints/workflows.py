from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database.session import get_db
from app.models import Workflow, WorkflowExecution, AuditLog
from app.api.deps import get_current_user
from app.automation.engine import run_workflow_pipeline, STANDARD_PIPELINE_STEPS
from app.automation.scheduler import sync_workflow_jobs

router = APIRouter()

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str = "manual"  # manual, file_upload, scheduled, api
    schedule_cron: Optional[str] = None  # e.g. "0 2 * * *" for 2:00 AM daily
    is_active: bool = True
    steps_config: Optional[List[Dict[str, Any]]] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    schedule_cron: Optional[str] = None
    is_active: Optional[bool] = None
    steps_config: Optional[List[Dict[str, Any]]] = None

def ensure_default_workflows(db: Session):
    """Seeds baseline Fuji Kyuko production workflows if table is empty."""
    if db.query(Workflow).count() == 0:
        wf1 = Workflow(
            name="Daily Fuji Kyuko POS Ingestion & Audit Pipeline",
            description="Automated end-to-end processing: file parsing, contract validation, database storage, revenue calculation, anomaly detection, and summary report generation.",
            trigger_type="scheduled",
            schedule_cron="0 2 * * *",
            is_active=True,
            steps_config=STANDARD_PIPELINE_STEPS
        )
        wf2 = Workflow(
            name="Weekly Inventory Replenishment & Safety Stock Scan",
            description="Scans logistics depots across Fujiyoshida and Kawaguchiko, evaluates low-stock conditions (qty <= reorder_level), and calculates purchase replenishment budgets.",
            trigger_type="scheduled",
            schedule_cron="0 6 * * 1",
            is_active=True,
            steps_config=[
                {"id": "read_source", "name": "Read Inventory Excel Sheet", "mandatory": True},
                {"id": "validate_contract", "name": "Validate Inventory Schema Contract", "mandatory": True},
                {"id": "clean_data", "name": "Cleanse Warehouse Records", "mandatory": True},
                {"id": "store_postgresql", "name": "Update PostgreSQL Inventory Store", "mandatory": True},
                {"id": "calculate_analytics", "name": "Calculate Hub Stock Valuations", "mandatory": True},
                {"id": "generate_report", "name": "Generate Replenishment Order Report", "mandatory": True}
            ]
        )
        db.add(wf1)
        db.add(wf2)
        db.commit()

@router.get("")
def list_workflows(
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    ensure_default_workflows(db)
    wfs = db.query(Workflow).order_by(Workflow.id).all()
    results = []
    for wf in wfs:
        last_exec = db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == wf.id
        ).order_by(desc(WorkflowExecution.start_time)).first()
        
        results.append({
            "id": wf.id,
            "name": wf.name,
            "description": wf.description,
            "trigger_type": wf.trigger_type,
            "schedule_cron": wf.schedule_cron,
            "is_active": wf.is_active,
            "steps_config": wf.steps_config or STANDARD_PIPELINE_STEPS,
            "created_at": wf.created_at.isoformat() if wf.created_at else None,
            "last_execution": {
                "execution_id": last_exec.execution_id,
                "status": last_exec.status,
                "start_time": last_exec.start_time.isoformat() if last_exec.start_time else None,
                "duration_seconds": last_exec.duration_seconds
            } if last_exec else None
        })
    return results

@router.post("", status_code=status.HTTP_201_CREATED)
def create_workflow(
    wf_in: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    wf = Workflow(
        name=wf_in.name,
        description=wf_in.description,
        trigger_type=wf_in.trigger_type,
        schedule_cron=wf_in.schedule_cron,
        is_active=wf_in.is_active,
        steps_config=wf_in.steps_config or STANDARD_PIPELINE_STEPS
    )
    db.add(wf)
    db.add(AuditLog(
        user_email=current_user.email,
        action="CREATE_WORKFLOW",
        entity_type="WORKFLOW",
        details={"name": wf.name, "trigger": wf.trigger_type}
    ))
    db.commit()
    db.refresh(wf)
    sync_workflow_jobs()
    return wf

@router.get("/executions")
def get_workflow_executions(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """Centralized execution monitoring history across all workflows."""
    execs = db.query(WorkflowExecution).order_by(desc(WorkflowExecution.start_time)).limit(limit).all()
    results = []
    for e in execs:
        results.append({
            "id": e.id,
            "execution_id": e.execution_id,
            "workflow_id": e.workflow_id,
            "workflow_name": e.workflow.name if e.workflow else "Unknown Workflow",
            "trigger_type": e.trigger_type,
            "status": e.status,
            "start_time": e.start_time.isoformat() if e.start_time else None,
            "end_time": e.end_time.isoformat() if e.end_time else None,
            "duration_seconds": e.duration_seconds,
            "records_processed": e.records_processed,
            "failed_step": e.failed_step,
            "error_message": e.error_message,
            "step_count": len(e.step_details) if e.step_details else 0
        })
    return results

@router.get("/executions/{execution_id}")
def get_execution_details(
    execution_id: str,
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """Detailed step-level diagnostics and execution logs."""
    e = db.query(WorkflowExecution).filter(WorkflowExecution.execution_id == execution_id).first()
    if not e:
        raise HTTPException(status_code=404, detail=f"Execution '{execution_id}' not found.")
    return {
        "execution_id": e.execution_id,
        "workflow_id": e.workflow_id,
        "workflow_name": e.workflow.name if e.workflow else "Unknown Workflow",
        "trigger_type": e.trigger_type,
        "status": e.status,
        "start_time": e.start_time.isoformat() if e.start_time else None,
        "end_time": e.end_time.isoformat() if e.end_time else None,
        "duration_seconds": e.duration_seconds,
        "records_processed": e.records_processed,
        "failed_step": e.failed_step,
        "error_message": e.error_message,
        "step_details": e.step_details or []
    }

@router.post("/executions/{execution_id}/retry")
def retry_execution(
    execution_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retries a failed workflow execution with identical pipeline parameters."""
    old_exec = db.query(WorkflowExecution).filter(WorkflowExecution.execution_id == execution_id).first()
    if not old_exec:
        raise HTTPException(status_code=404, detail="Execution not found to retry.")

    res = run_workflow_pipeline(
        workflow_id=old_exec.workflow_id,
        trigger_type=f"retry_{execution_id}",
        db=db
    )
    return res

@router.get("/stats")
def get_workflow_statistics(
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """Execution metrics: total runs, success rate, average duration."""
    total_runs = db.query(WorkflowExecution).count()
    success_count = db.query(WorkflowExecution).filter(WorkflowExecution.status == "success").count()
    failed_count = db.query(WorkflowExecution).filter(WorkflowExecution.status == "failed").count()
    avg_duration = db.query(func.avg(WorkflowExecution.duration_seconds)).scalar() or 0.0

    success_rate = round((success_count / total_runs) * 100, 1) if total_runs > 0 else 0.0

    return {
        "total_executions": total_runs,
        "successful_executions": success_count,
        "failed_executions": failed_count,
        "success_rate_pct": success_rate,
        "average_duration_seconds": round(float(avg_duration), 2)
    }

@router.post("/{workflow_id}/run")
def trigger_workflow_execution(
    workflow_id: int,
    custom_file_path: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Executes actual business pipeline steps and stores execution logs in PostgreSQL.
    """
    try:
        res = run_workflow_pipeline(
            workflow_id=workflow_id,
            trigger_type="manual",
            custom_file_path=custom_file_path,
            db=db
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
