import requests
import json
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))
from app.database.session import SessionLocal
from app.models import BusinessTransaction, DataImport, ValidationIssue

# Clear previous test transactions for fresh upload demo
db = SessionLocal()
db.query(ValidationIssue).delete()
db.query(BusinessTransaction).filter(BusinessTransaction.transaction_id.like("TXN-%")).delete()
db.query(DataImport).delete()
db.commit()
db.close()

BASE_URL = "http://localhost:8000"

print("=== 1. Login as Admin ===")
r_login = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
    "email": "admin@fujikyuko.co.jp",
    "password": "FujiFlow2026!"
})
assert r_login.status_code == 200
token = r_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n=== 2. Preview Sample Sales File ===")
sample_path = "data/samples/fuji_kyuko_sales_march_2026.csv"
r_prev = requests.post(
    f"{BASE_URL}/api/v1/uploads/preview",
    data={"sample_path": sample_path},
    headers=headers
)
assert r_prev.status_code == 200
meta = r_prev.json()
print(f"File: {meta['file_name']}, Rows: {meta['total_rows']}, Cols: {meta['total_columns']}")

print("\n=== 3. Clean & Validate Dataset (Sales Contract) ===")
r_val = requests.post(
    f"{BASE_URL}/api/v1/uploads/clean-and-validate",
    data={
        "file_path": meta["temp_file_path"],
        "contract_type": "sales"
    },
    headers=headers
)
assert r_val.status_code == 200
val = r_val.json()
print("Validation Summary:", json.dumps(val["summary"], indent=2))
print("Cleaning Ops Executed:", val["cleaning_operations"])
print(f"Identified Issues: {len(val['issues'])}")
for iss in val["issues"]:
    print(f" - Row {iss['row_number']} [{iss['field_name']}]: {iss['error_message']} (Correction: {iss.get('proposed_correction')})")

import_id = val["import_id"]

print("\n=== 4. Confirm Import into PostgreSQL Core Tables ===")
r_conf = requests.post(f"{BASE_URL}/api/v1/uploads/{import_id}/confirm", headers=headers)
assert r_conf.status_code == 200
print("Confirm Response:", r_conf.json())

print("\n=== 5. Query Executive Dashboard (Post-Import Real Calculation) ===")
r_dash = requests.get(f"{BASE_URL}/api/v1/dashboard/summary?time_range=all", headers=headers)
assert r_dash.status_code == 200
dash = r_dash.json()
print("Executive KPIs:", json.dumps(dash["kpis"], indent=2))
print(f"Daily Sales Trend Points: {len(dash['sales_trends'])}")
print(f"Category Breakdowns: {len(dash['category_performance'])}")
for cat in dash["category_performance"]:
    print(f" - {cat['category']}: ¥{cat['revenue']:,.2f} ({cat['percentage']}%) across {cat['transaction_count']} txns")

print("Provenance Metadata:", json.dumps(dash["metadata"], indent=2))
assert dash["kpis"]["has_real_data"] is True
assert dash["kpis"]["total_transactions"] >= 20
assert dash["kpis"]["total_sales"] > 0
print("\n>>> PHASE 2 DATA INGESTION & PIPELINE ENGINE FULLY VERIFIED! <<<")
