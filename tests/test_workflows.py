import os
import pytest
from app.database.session import SessionLocal
from app.models import Workflow, WorkflowExecution
from app.automation.engine import run_workflow_pipeline

def test_list_workflows_seeds_defaults(client, auth_headers):
    response = client.get("/api/v1/workflows", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    names = [w["name"] for w in data]
    assert any("Daily Fuji Kyuko POS" in n for n in names)
    assert any("Weekly Inventory" in n for n in names)

def test_create_custom_workflow(client, auth_headers):
    payload = {
        "name": "Custom Nightly Bus Transit Audit",
        "description": "Custom workflow for highway express buses",
        "trigger_type": "scheduled",
        "schedule_cron": "0 3 * * *",
        "is_active": True
    }
    response = client.post("/api/v1/workflows", json=payload, headers=auth_headers)
    assert response.status_code == 201
    wf = response.json()
    assert wf["name"] == "Custom Nightly Bus Transit Audit"
    assert wf["trigger_type"] == "scheduled"

def test_execute_workflow_success(client, auth_headers):
    # Clear previous test transactions so the pipeline can validate and ingest fresh records
    db = SessionLocal()
    from app.models import BusinessTransaction, AnomalyDetection, GeneratedReport
    db.query(AnomalyDetection).delete()
    db.query(GeneratedReport).delete()
    db.query(BusinessTransaction).filter(BusinessTransaction.transaction_id.like("TXN-%")).delete()
    db.commit()
    db.close()

    # Fetch first seeded workflow
    workflows = client.get("/api/v1/workflows", headers=auth_headers).json()
    wf_id = workflows[0]["id"]

    res = client.post(f"/api/v1/workflows/{wf_id}/run", headers=auth_headers)
    assert res.status_code == 200
    exec_data = res.json()
    assert "execution_id" in exec_data
    assert exec_data["status"] == "success"
    assert exec_data["duration_seconds"] >= 0
    assert len(exec_data["steps"]) >= 6
    
    # Check that individual step statuses are success
    for s in exec_data["steps"]:
        assert s["status"] == "success"

def test_workflow_failure_detection_mandatory_step():
    db = SessionLocal()
    # Test failure behavior: non-existent file path
    wf = db.query(Workflow).first()
    assert wf is not None

    res = run_workflow_pipeline(
        workflow_id=wf.id,
        trigger_type="test_failure",
        custom_file_path="non_existent_file_path_xyz.csv",
        db=db
    )
    db.close()

    # Per requirement: MUST detect failure, record exact step name, and NOT report success
    assert res["status"] == "failed"
    assert res["failed_step"] is not None
    assert "Read Excel/CSV Source" in res["failed_step"]
    assert "Source file not found" in res["error_message"]

def test_workflow_executions_and_retry(client, auth_headers):
    # 1. Get executions history
    res_hist = client.get("/api/v1/workflows/executions", headers=auth_headers)
    assert res_hist.status_code == 200
    executions = res_hist.json()
    assert len(executions) >= 1
    target_exec_id = executions[0]["execution_id"]

    # 2. Get step-level execution details
    res_detail = client.get(f"/api/v1/workflows/executions/{target_exec_id}", headers=auth_headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["execution_id"] == target_exec_id
    assert "step_details" in detail

    # 3. Test retry
    res_retry = client.post(f"/api/v1/workflows/executions/{target_exec_id}/retry", headers=auth_headers)
    assert res_retry.status_code == 200
    retry_data = res_retry.json()
    assert retry_data["execution_id"] != target_exec_id
    assert "EXEC-" in retry_data["execution_id"]

def test_workflow_statistics(client, auth_headers):
    response = client.get("/api/v1/workflows/stats", headers=auth_headers)
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_executions"] >= 1
    assert "success_rate_pct" in stats
    assert "average_duration_seconds" in stats
