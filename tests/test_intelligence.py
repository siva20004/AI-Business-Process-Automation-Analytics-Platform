import pytest
from app.models.all_models import BusinessTransaction, InventoryRecord, AnomalyDetection

def test_anomaly_scan_and_listing(client, auth_headers):
    # 1. Trigger anomaly scan
    scan_resp = client.post("/api/v1/anomalies/scan", headers=auth_headers)
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()
    assert scan_data["status"] == "success"
    assert "total_anomalies" in scan_data
    assert "duration_seconds" in scan_data

    # 2. List anomalies
    list_resp = client.get("/api/v1/anomalies", headers=auth_headers)
    assert list_resp.status_code == 200
    anomalies = list_resp.json()
    assert isinstance(anomalies, list)
    if len(anomalies) > 0:
        anom = anomalies[0]
        assert "record_id" in anom
        assert "detection_method" in anom
        assert "observed_value" in anom
        assert "reason" in anom
        assert anom["status"] in ["unreviewed", "reviewed", "dismissed", "escalated"]

def test_anomaly_stats(client, auth_headers):
    resp = client.get("/api/v1/anomalies/stats", headers=auth_headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert "total_anomalies" in stats
    assert "unreviewed" in stats
    assert "method_breakdown" in stats

def test_anomaly_human_review_workflow(client, auth_headers):
    # Trigger scan first to guarantee anomalies exist
    client.post("/api/v1/anomalies/scan", headers=auth_headers)
    
    # Retrieve anomalies
    list_resp = client.get("/api/v1/anomalies", headers=auth_headers)
    assert list_resp.status_code == 200
    anomalies = list_resp.json()
    assert len(anomalies) > 0, "At least one anomaly should be registered"
    anom_id = anomalies[0]["id"]

    # Review as "reviewed" with notes
    review_resp = client.post(
        f"/api/v1/anomalies/{anom_id}/review",
        json={"status": "reviewed", "notes": "Audited by Fuji Kyuko corporate controller - verified corporate booking."},
        headers=auth_headers
    )
    assert review_resp.status_code == 200
    data = review_resp.json()
    assert data["status"] == "success"
    assert data["new_status"] == "reviewed"
    assert data["reviewed_by"] == "admin@fujikyuko.co.jp"

def test_business_insights_executive_summary(client, auth_headers):
    resp = client.get("/api/v1/insights/executive-summary?time_range=all", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "has_data" in data
    assert "provenance" in data
    assert data["provenance"]["data_source"] == "PostgreSQL Core Database (fuji_flow)"

    if data["has_data"]:
        assert data["executive_briefing"] is not None
        assert isinstance(data["strategic_recommendations"], list)
        assert isinstance(data["key_findings"], list)

def test_business_insights_grounded_qa(client, auth_headers):
    # Ask about total revenue
    q1 = client.post(
        "/api/v1/insights/ask",
        json={"question": "What is our current total revenue?"},
        headers=auth_headers
    )
    assert q1.status_code == 200
    d1 = q1.json()
    assert "answer" in d1
    assert "¥" in d1["answer"]
    assert d1["provenance"]["hallucination_risk"] == "0.0% (Deterministic Aggregation)"

    # Ask about average transaction value
    q2 = client.post(
        "/api/v1/insights/ask",
        json={"question": "What is the average transaction value?"},
        headers=auth_headers
    )
    assert q2.status_code == 200
    d2 = q2.json()
    assert "¥" in d2["answer"]
    assert "supporting_data" in d2
