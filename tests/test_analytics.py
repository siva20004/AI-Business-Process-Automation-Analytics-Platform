import os
import pytest
from app.database.session import SessionLocal
from app.models import BusinessTransaction, InventoryRecord, DataImport, ValidationIssue
from app.analytics.sales_analytics import compute_sales_analytics
from app.analytics.inventory_analytics import compute_inventory_analytics
from app.data_processing.parser import parse_file
from app.data_processing.cleaner import clean_dataframe
from app.data_processing.validator import validate_inventory_contract

@pytest.fixture(scope="module", autouse=True)
def setup_analytics_data():
    db = SessionLocal()
    # Ensure inventory data is committed for analytics tests
    sample_xlsx = "data/samples/fuji_kyuko_inventory_2026.xlsx"
    df_raw, _ = parse_file(sample_xlsx)
    df_cleaned, _ = clean_dataframe(df_raw)
    valid_inv, _, _, _ = validate_inventory_contract(df_cleaned)
    
    # Clear existing inventory items
    db.query(InventoryRecord).delete()
    for item in valid_inv:
        inv = InventoryRecord(
            product_id=item["product_id"],
            product_name=item["product_name"],
            category=item["category"],
            available_quantity=int(item["available_quantity"]),
            reorder_level=int(item["reorder_level"]),
            unit_cost=float(item["unit_cost"]),
            warehouse=item["warehouse"]
        )
        db.add(inv)
    db.commit()
    db.close()
    yield

def test_sales_analytics_endpoint(client, auth_headers):
    response = client.get("/api/v1/analytics/sales?time_range=all", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "has_data" in data
    assert "kpis" in data
    assert "daily_trends" in data
    assert "category_performance" in data
    assert "top_products" in data
    
    if data["has_data"]:
        assert data["kpis"]["total_sales"] > 0
        assert data["kpis"]["total_transactions"] > 0
        assert data["kpis"]["average_transaction_value"] > 0
        assert len(data["category_performance"]) > 0

def test_inventory_analytics_computation():
    db = SessionLocal()
    inv_data = compute_inventory_analytics(db)
    db.close()
    
    assert inv_data["has_data"] is True
    assert inv_data["kpis"]["total_skus"] == 8
    assert inv_data["kpis"]["total_units_on_hand"] > 0
    assert inv_data["kpis"]["total_inventory_valuation"] > 0
    
    # Verify low stock condition: available_quantity <= reorder_level
    # In sample dataset:
    # 1. INV-BUS-TIRE-01: qty 8, reorder 12 (LOW STOCK)
    # 2. INV-WINE-KOSHU: qty 24, reorder 30 (LOW STOCK)
    # 3. INV-FOOD-HOUTOU: qty 12, reorder 25 (LOW STOCK)
    assert inv_data["kpis"]["low_stock_sku_count"] >= 3
    assert len(inv_data["low_stock_items"]) >= 3
    assert len(inv_data["reorder_recommendations"]) >= 3
    
    # Check that recommendation includes suggested reorder quantity and estimated cost
    rec = inv_data["reorder_recommendations"][0]
    assert rec["suggested_reorder_qty"] > 0
    assert rec["estimated_reorder_cost"] > 0
    assert "warehouse" in rec

def test_inventory_analytics_api_endpoint(client, auth_headers):
    response = client.get("/api/v1/analytics/inventory", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["has_data"] is True
    assert data["kpis"]["total_skus"] == 8
    assert len(data["warehouse_breakdown"]) > 0
    assert len(data["category_breakdown"]) > 0

def test_analytics_filters_endpoint(client, auth_headers):
    response = client.get("/api/v1/analytics/filters", headers=auth_headers)
    assert response.status_code == 200
    filters = response.json()
    assert "categories" in filters
    assert "warehouses" in filters
    assert len(filters["warehouses"]) > 0
