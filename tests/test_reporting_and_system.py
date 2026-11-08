import os
import pytest
from app.models.all_models import GeneratedReport, User

def test_report_generation_pdf(client, auth_headers):
    resp = client.post(
        "/api/v1/reports/generate",
        json={"report_type": "executive_briefing", "file_format": "pdf", "time_range": "all"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "report_id" in data
    assert data["file_format"] == "pdf"
    assert os.path.exists(data["file_path"])

    # Test downloading the generated PDF
    dl_resp = client.get(f"/api/v1/reports/{data['report_id']}/download", headers=auth_headers)
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert len(dl_resp.content) > 1000

def test_report_generation_xlsx(client, auth_headers):
    resp = client.post(
        "/api/v1/reports/generate",
        json={"report_type": "daily_sales", "file_format": "xlsx", "time_range": "all"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["file_format"] == "xlsx"
    assert os.path.exists(data["file_path"])

def test_report_generation_csv(client, auth_headers):
    resp = client.post(
        "/api/v1/reports/generate",
        json={"report_type": "inventory_status", "file_format": "csv", "time_range": "all"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["file_format"] == "csv"

def test_email_configuration_and_preview(client, auth_headers):
    # Config
    cfg_resp = client.get("/api/v1/email/config", headers=auth_headers)
    assert cfg_resp.status_code == 200
    cfg = cfg_resp.json()
    assert "smtp_server" in cfg
    assert "sender_email" in cfg

    # Preview
    preview_resp = client.post(
        "/api/v1/email/preview",
        json={
            "template_type": "daily_briefing",
            "recipients": ["management@fujikyuko.co.jp"],
            "custom_note": "Confidential management briefing for Q1 DX board review."
        },
        headers=auth_headers
    )
    assert preview_resp.status_code == 200
    preview = preview_resp.json()
    assert "subject" in preview
    assert "body_html" in preview
    assert "FUJI FLOW" in preview["body_html"]

def test_email_send_and_history(client, auth_headers):
    send_resp = client.post(
        "/api/v1/email/send",
        json={
            "template_type": "inventory_alert",
            "recipients": ["procurement@fujikyuko.co.jp"],
            "custom_note": "Expedite reorder for depleted merchandise SKUs."
        },
        headers=auth_headers
    )
    assert send_resp.status_code == 200
    sent = send_resp.json()
    assert sent["status"] == "delivered"
    assert "recipients" in sent

    # Check history
    hist_resp = client.get("/api/v1/email/history", headers=auth_headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) > 0

def test_user_management_listing_and_creation(client, auth_headers):
    # List users
    users_resp = client.get("/api/v1/users", headers=auth_headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 2

    # Create new user
    import uuid
    new_email = f"operator_{uuid.uuid4().hex[:6]}@fujikyuko.co.jp"
    create_resp = client.post(
        "/api/v1/users",
        json={
            "email": new_email,
            "full_name": "Fuji Kyuko Field Auditor",
            "password": "SecurePassword2026!",
            "role": "analyst"
        },
        headers=auth_headers
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["status"] == "success"
    assert created["email"] == new_email

def test_system_settings_endpoint(client, auth_headers):
    resp = client.get("/api/v1/settings", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "platform" in data
    assert "database" in data
    assert "system_telemetry" in data
    assert data["governance"]["strict_real_data_policy"] == "ENFORCED (Zero Synthetic Data)"
