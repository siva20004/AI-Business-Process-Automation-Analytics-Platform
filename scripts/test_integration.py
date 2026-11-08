import requests
import json

BASE_URL = "http://localhost:8000"

print("--- 1. Testing Health Endpoint ---")
r_health = requests.get(f"{BASE_URL}/health")
print(f"Status: {r_health.status_code}")
print(json.dumps(r_health.json(), indent=2))
assert r_health.status_code == 200
assert r_health.json()["database"]["status"] == "connected"

print("\n--- 2. Testing Authentication (Admin) ---")
login_payload = {
    "email": "admin@fujikyuko.co.jp",
    "password": "FujiFlow2026!"
}
r_login = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_payload)
print(f"Login Status: {r_login.status_code}")
assert r_login.status_code == 200
token = r_login.json()["access_token"]
user_info = r_login.json()["user"]
print(f"Authenticated as: {user_info['full_name']} ({user_info['role']})")

headers = {"Authorization": f"Bearer {token}"}

print("\n--- 3. Testing Executive Dashboard Endpoint ---")
r_dash = requests.get(f"{BASE_URL}/api/v1/dashboard/summary?time_range=30d", headers=headers)
print(f"Dashboard Status: {r_dash.status_code}")
dash_data = r_dash.json()
print("KPI Summary:", json.dumps(dash_data["kpis"], indent=2))
print("Metadata:", json.dumps(dash_data["metadata"], indent=2))
print("Empty state message:", dash_data.get("empty_state_message"))
assert r_dash.status_code == 200
# Strictly real data: no fake sales or random numbers
assert dash_data["kpis"]["has_real_data"] is False
assert "No business data available" in dash_data["empty_state_message"]

print("\n--- 4. Testing Data Sources Endpoint ---")
r_ds = requests.get(f"{BASE_URL}/api/v1/data-sources", headers=headers)
print(f"Data Sources Count: {len(r_ds.json())}")
for ds in r_ds.json():
    print(f" - [{ds['id']}] {ds['name']} ({ds['source_type']}) - Status: {ds['status']}")

print("\n--- 5. Testing Live Connection Handshake ---")
for ds in r_ds.json():
    test_res = requests.post(f"{BASE_URL}/api/v1/data-sources/{ds['id']}/test", headers=headers)
    print(f"Tested Source #{ds['id']}: {test_res.json()}")
    assert test_res.json()["success"] is True

print("\n>>> ALL PHASE 1 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<")
