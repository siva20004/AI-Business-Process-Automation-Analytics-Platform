import requests
import json

BASE_URL = "http://localhost:8000"

print("=== 1. Login as Admin ===")
r_login = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
    "email": "admin@fujikyuko.co.jp",
    "password": "FujiFlow2026!"
})
assert r_login.status_code == 200
token = r_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n=== 2. Verify Analytics Filter Options ===")
r_filt = requests.get(f"{BASE_URL}/api/v1/analytics/filters", headers=headers)
assert r_filt.status_code == 200
filters = r_filt.json()
print("Available Divisions:", filters["categories"])
print("Available Warehouses:", filters["warehouses"])
print(f"Products Count: {len(filters['products'])}")
assert len(filters["categories"]) >= 5
assert len(filters["warehouses"]) >= 3

print("\n=== 3. Query Real Sales Analytics ===")
r_sales = requests.get(f"{BASE_URL}/api/v1/analytics/sales?time_range=all", headers=headers)
assert r_sales.status_code == 200
sales = r_sales.json()
print("Sales KPIs:", json.dumps(sales["kpis"], indent=2))
print("Category Performance:", json.dumps(sales["category_performance"][:3], indent=2))
print("Top 3 Products:", json.dumps(sales["top_products"][:3], indent=2))

assert sales["has_data"] is True
assert sales["kpis"]["total_sales"] > 0
assert sales["kpis"]["total_transactions"] >= 20
assert sales["kpis"]["average_transaction_value"] > 0
assert len(sales["daily_trends"]) > 0

print("\n=== 4. Query Real Inventory Analytics ===")
r_inv = requests.get(f"{BASE_URL}/api/v1/analytics/inventory", headers=headers)
assert r_inv.status_code == 200
inv = r_inv.json()
print("Inventory KPIs:", json.dumps(inv["kpis"], indent=2))
print(f"Low Stock SKUs Detected: {len(inv['low_stock_items'])}")
for item in inv["low_stock_items"]:
    print(f" - [{item['product_id']}] {item['product_name']}: Current Stock {item['available_quantity']} <= Reorder Level {item['reorder_level']} at {item['warehouse']} (Urgency: {item['urgency']})")

print("\nReorder Planning Recommendations:")
for rec in inv["reorder_recommendations"]:
    print(f" - Reorder +{rec['suggested_reorder_qty']} units of {rec['product_id']} -> Est. Cost: ¥{rec['estimated_reorder_cost']:,.2f}")

print("\nWarehouse Distribution:")
for wh in inv["warehouse_breakdown"]:
    print(f" - {wh['warehouse']}: {wh['sku_count']} SKUs, {wh['total_units']} units, Valuation: ¥{wh['total_valuation']:,.2f}")

assert inv["has_data"] is True
assert inv["kpis"]["total_skus"] == 8
assert inv["kpis"]["low_stock_sku_count"] >= 3
assert inv["kpis"]["total_inventory_valuation"] > 0
assert len(inv["warehouse_breakdown"]) >= 3

print("\n>>> PHASE 3 SALES & INVENTORY ANALYTICS FULLY VERIFIED! <<<")
