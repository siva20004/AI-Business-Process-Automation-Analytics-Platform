def test_get_data_sources(client, auth_headers):
    response = client.get("/api/v1/data-sources", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    names = [ds["name"] for ds in data]
    assert any("PostgreSQL" in n for n in names)

def test_test_data_source_connection(client, auth_headers):
    # Fetch first source (which is PostgreSQL or Local File Repo)
    sources = client.get("/api/v1/data-sources", headers=auth_headers).json()
    ds_id = sources[0]["id"]
    
    test_res = client.post(f"/api/v1/data-sources/{ds_id}/test", headers=auth_headers)
    assert test_res.status_code == 200
    result = test_res.json()
    assert result["success"] is True
    assert result["status"] == "connected"
    assert result["latency_ms"] is not None
