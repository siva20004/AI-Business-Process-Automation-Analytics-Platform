import pandas as pd
import datetime

# 1. Fuji Kyuko Sales Dataset
sales_data = [
    # Valid records
    {"transaction_id": "TXN-20260301-001", "transaction_date": "2026-03-01 08:30:00", "product_id": "BUS-5TH-01", "product_name": "Mt. Fuji 5th Station Shuttle Bus", "category": "Transportation", "quantity": 2, "unit_price": 2600.0, "total_amount": 5200.0, "business_unit": "Fuji Express Bus"},
    {"transaction_id": "TXN-20260301-002", "transaction_date": "2026-03-01 09:15:00", "product_id": "FQ-PASS-DAY", "product_name": "Fuji-Q Highland 1-Day Free Pass", "category": "Amusement", "quantity": 4, "unit_price": 7800.0, "total_amount": 31200.0, "business_unit": "Fuji-Q Highland"},
    {"transaction_id": "TXN-20260301-003", "transaction_date": "2026-03-01 09:45:00", "product_id": "TRAIN-EXP-01", "product_name": "Fujisan View Express Reserved Seat", "category": "Transportation", "quantity": 2, "unit_price": 4000.0, "total_amount": 8000.0, "business_unit": "Fujikyu Railway"},
    {"transaction_id": "TXN-20260301-004", "transaction_date": "2026-03-01 10:20:00", "product_id": "ROPE-ROUND", "product_name": "Mt. Fuji Panoramic Ropeway Round Trip", "category": "Tourism", "quantity": 3, "unit_price": 1000.0, "total_amount": 3000.0, "business_unit": "Fuji Ropeway"},
    {"transaction_id": "TXN-20260301-005", "transaction_date": "2026-03-01 11:30:00", "product_id": "BOAT-CRUISE", "product_name": "Lake Kawaguchiko Cruise Ticket", "category": "Tourism", "quantity": 2, "unit_price": 1200.0, "total_amount": 2400.0, "business_unit": "Fuji Kanko Boat"},
    {"transaction_id": "TXN-20260301-006", "transaction_date": "2026-03-01 12:45:00", "product_id": "FOOD-HOTEL-DIN", "product_name": "Highland Resort Fujiyama Kaiseki Dinner", "category": "Food", "quantity": 2, "unit_price": 14000.0, "total_amount": 28000.0, "business_unit": "Highland Resort Hotel"},
    {"transaction_id": "TXN-20260301-007", "transaction_date": "2026-03-01 14:10:00", "product_id": "RET-WINE-KOSHU", "product_name": "Yamanashi Koshu Reserve Wine 750ml", "category": "Retail", "quantity": 1, "unit_price": 3800.0, "total_amount": 3800.0, "business_unit": "Fujisan Station Souvenir"},
    {"transaction_id": "TXN-20260301-008", "transaction_date": "2026-03-01 15:30:00", "product_id": "RET-COOKIE-BOX", "product_name": "Fujiyama Special Cookie Assortment Box", "category": "Retail", "quantity": 3, "unit_price": 1800.0, "total_amount": 5400.0, "business_unit": "Fujiyama Onsen Gift"},
    {"transaction_id": "TXN-20260302-001", "transaction_date": "2026-03-02 08:50:00", "product_id": "HOTEL-SUITE-01", "product_name": "Mt. Fuji Panoramic View Executive Suite", "category": "Hotel", "quantity": 1, "unit_price": 68000.0, "total_amount": 68000.0, "business_unit": "Highland Resort Hotel & Spa"},
    {"transaction_id": "TXN-20260302-002", "transaction_date": "2026-03-02 10:10:00", "product_id": "FQ-EXP-ZOKKON", "product_name": "ZOKKON Priority Express Attraction Ticket", "category": "Amusement", "quantity": 4, "unit_price": 2000.0, "total_amount": 8000.0, "business_unit": "Fuji-Q Highland"},
    {"transaction_id": "TXN-20260302-003", "transaction_date": "2026-03-02 12:00:00", "product_id": "FOOD-HOUTOU-01", "product_name": "Authentic Yamanashi Houtou Noodle Set", "category": "Food", "quantity": 4, "unit_price": 1650.0, "total_amount": 6600.0, "business_unit": "Fujikyu Highland Dining"},
    {"transaction_id": "TXN-20260302-004", "transaction_date": "2026-03-02 14:00:00", "product_id": "BUS-5TH-01", "product_name": "Mt. Fuji 5th Station Shuttle Bus", "category": "Transportation", "quantity": 5, "unit_price": 2600.0, "total_amount": 13000.0, "business_unit": "Fuji Express Bus"},
    {"transaction_id": "TXN-20260303-001", "transaction_date": "2026-03-03 09:30:00", "product_id": "FQ-PASS-DAY", "product_name": "Fuji-Q Highland 1-Day Free Pass", "category": "Amusement", "quantity": 6, "unit_price": 7800.0, "total_amount": 46800.0, "business_unit": "Fuji-Q Highland"},
    {"transaction_id": "TXN-20260303-002", "transaction_date": "2026-03-03 11:15:00", "product_id": "ROPE-ROUND", "product_name": "Mt. Fuji Panoramic Ropeway Round Trip", "category": "Tourism", "quantity": 4, "unit_price": 1000.0, "total_amount": 4000.0, "business_unit": "Fuji Ropeway"},
    {"transaction_id": "TXN-20260303-003", "transaction_date": "2026-03-03 13:40:00", "product_id": "HOTEL-STD-02", "product_name": "Standard Twin Room - 1 Night", "category": "Hotel", "quantity": 2, "unit_price": 32000.0, "total_amount": 64000.0, "business_unit": "Highland Resort Hotel & Spa"},
    {"transaction_id": "TXN-20260304-001", "transaction_date": "2026-03-04 10:00:00", "product_id": "RET-WINE-KOSHU", "product_name": "Yamanashi Koshu Reserve Wine 750ml", "category": "Retail", "quantity": 2, "unit_price": 3800.0, "total_amount": 7600.0, "business_unit": "Fujisan Station Souvenir"},
    {"transaction_id": "TXN-20260304-002", "transaction_date": "2026-03-04 12:30:00", "product_id": "TRAIN-EXP-01", "product_name": "Fujisan View Express Reserved Seat", "category": "Transportation", "quantity": 3, "unit_price": 4000.0, "total_amount": 12000.0, "business_unit": "Fujikyu Railway"},
    {"transaction_id": "TXN-20260304-003", "transaction_date": "2026-03-04 16:00:00", "product_id": "BOAT-CRUISE", "product_name": "Lake Kawaguchiko Cruise Ticket", "category": "Tourism", "quantity": 5, "unit_price": 1200.0, "total_amount": 6000.0, "business_unit": "Fuji Kanko Boat"},
    {"transaction_id": "TXN-20260305-001", "transaction_date": "2026-03-05 09:10:00", "product_id": "FQ-PASS-DAY", "product_name": "Fuji-Q Highland 1-Day Free Pass", "category": "Amusement", "quantity": 2, "unit_price": 7800.0, "total_amount": 15600.0, "business_unit": "Fuji-Q Highland"},
    {"transaction_id": "TXN-20260305-002", "transaction_date": "2026-03-05 15:45:00", "product_id": "FOOD-HOTEL-DIN", "product_name": "Highland Resort Fujiyama Kaiseki Dinner", "category": "Food", "quantity": 3, "unit_price": 14000.0, "total_amount": 42000.0, "business_unit": "Highland Resort Hotel"},

    # Edge cases to test validation engine:
    # 1. Math calculation error (quantity 3 * unit_price 1800 should be 5400, but recorded as 4500)
    {"transaction_id": "TXN-20260305-ERR-MATH", "transaction_date": "2026-03-05 16:20:00", "product_id": "RET-COOKIE-BOX", "product_name": "Fujiyama Special Cookie Assortment Box", "category": "Retail", "quantity": 3, "unit_price": 1800.0, "total_amount": 4500.0, "business_unit": "Fujisan Station Souvenir"},
    # 2. Duplicate Transaction ID (matches TXN-20260301-001)
    {"transaction_id": "TXN-20260301-001", "transaction_date": "2026-03-05 17:00:00", "product_id": "BUS-5TH-01", "product_name": "Mt. Fuji 5th Station Shuttle Bus", "category": "Transportation", "quantity": 1, "unit_price": 2600.0, "total_amount": 2600.0, "business_unit": "Fuji Express Bus"},
    # 3. Invalid quantity (quantity is 0)
    {"transaction_id": "TXN-20260305-ERR-QTY", "transaction_date": "2026-03-05 17:30:00", "product_id": "ROPE-ROUND", "product_name": "Mt. Fuji Panoramic Ropeway Round Trip", "category": "Tourism", "quantity": 0, "unit_price": 1000.0, "total_amount": 0.0, "business_unit": "Fuji Ropeway"}
]

df_sales = pd.DataFrame(sales_data)
df_sales.to_csv("data/samples/fuji_kyuko_sales_march_2026.csv", index=False, encoding="utf-8")
print(f"Created data/samples/fuji_kyuko_sales_march_2026.csv with {len(df_sales)} records.")

# 2. Fuji Kyuko Inventory Dataset (Excel XLSX format)
inventory_data = [
    {"product_id": "INV-BUS-PARTS-01", "product_name": "Highway Bus Brake Pad Set Type-A", "category": "Transportation", "available_quantity": 42, "reorder_level": 15, "unit_cost": 8500.0, "warehouse": "Fujiyoshida Fleet Maintenance Hub"},
    {"product_id": "INV-BUS-TIRE-01", "product_name": "Heavy Duty Winter All-Season Tire 295/80R22.5", "category": "Transportation", "available_quantity": 8, "reorder_level": 12, "unit_cost": 32000.0, "warehouse": "Fujiyoshida Fleet Maintenance Hub"}, # LOW STOCK
    {"product_id": "INV-FQ-WRIST-01", "product_name": "Fuji-Q RFID Smart Admission Wristband", "category": "Amusement", "available_quantity": 1450, "reorder_level": 500, "unit_cost": 120.0, "warehouse": "Fuji-Q Central Operations Depo"},
    {"product_id": "INV-HOTEL-LINEN", "product_name": "Highland Resort Luxury Egyptian Cotton Sheets", "category": "Hotel", "available_quantity": 380, "reorder_level": 100, "unit_cost": 3400.0, "warehouse": "Highland Resort Storage B"},
    {"product_id": "INV-WINE-KOSHU", "product_name": "Yamanashi Koshu Reserve Vintage 2024", "category": "Retail", "available_quantity": 24, "reorder_level": 30, "unit_cost": 2100.0, "warehouse": "Fujisan Station Retail Cellar"}, # LOW STOCK
    {"product_id": "INV-COOKIE-BOX", "product_name": "Fujiyama Special Cookie Assortment Box", "category": "Retail", "available_quantity": 185, "reorder_level": 50, "unit_cost": 950.0, "warehouse": "Fujisan Station Retail Cellar"},
    {"product_id": "INV-FOOD-HOUTOU", "product_name": "Raw Houtou Fresh Noodle Portion 500g", "category": "Food", "available_quantity": 12, "reorder_level": 25, "unit_cost": 420.0, "warehouse": "Highland Central Kitchen Freezer"}, # LOW STOCK
    {"product_id": "INV-BOAT-LIFE-01", "product_name": "Marine Grade Passenger Life Vest 150N", "category": "Tourism", "available_quantity": 65, "reorder_level": 20, "unit_cost": 4800.0, "warehouse": "Kawaguchiko Pier Depot"}
]

df_inv = pd.DataFrame(inventory_data)
df_inv.to_excel("data/samples/fuji_kyuko_inventory_2026.xlsx", index=False)
print(f"Created data/samples/fuji_kyuko_inventory_2026.xlsx with {len(df_inv)} items.")
