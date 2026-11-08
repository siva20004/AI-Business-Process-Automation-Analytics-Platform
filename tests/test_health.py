def test_health_check_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["service"] == "FUJI FLOW"
    assert "database" in data
    assert data["database"]["status"] == "connected"
    assert data["database"]["healthy"] is True
    assert data["database"]["dialect"] in ["postgresql", "sqlite"]
