import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.services.init_db import init_db
from app.database.session import SessionLocal

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@fujikyuko.co.jp", "password": "FujiFlow2026!"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
