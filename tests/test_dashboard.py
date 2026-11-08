def test_dashboard_strict_real_data_empty_state(client, auth_headers):
    # When no transactions or business datasets have been uploaded yet:
    response = client.get("/api/v1/dashboard/summary?time_range=30d", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert "kpis" in data
    assert "metadata" in data
    # Real-data verification:
    if data["kpis"]["total_transactions"] == 0 and data["kpis"]["total_inventory_items"] == 0:
        assert data["kpis"]["has_real_data"] is False
        assert data["empty_state_message"] == "No business data available. Connect a data source or upload a dataset."
        assert len(data["sales_trends"]) == 0
        assert len(data["category_performance"]) == 0
        assert data["kpis"]["total_sales"] == 0.0
    else:
        assert data["kpis"]["has_real_data"] is True
    
    # Metadata must always identify source and calculation method
    assert "data_source" in data["metadata"]
    assert "calculation_method" in data["metadata"]
    assert "reporting_period" in data["metadata"]

def test_dashboard_unauthorized(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 401
