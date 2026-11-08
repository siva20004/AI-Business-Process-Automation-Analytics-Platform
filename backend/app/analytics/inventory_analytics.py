from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import InventoryRecord

def compute_inventory_analytics(
    db: Session,
    warehouse: Optional[str] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    query = db.query(InventoryRecord)
    if warehouse and warehouse != "all":
        query = query.filter(InventoryRecord.warehouse == warehouse)
    if category and category != "all":
        query = query.filter(InventoryRecord.category == category)

    total_skus = query.count()

    if total_skus == 0:
        return {
            "has_data": False,
            "message": "No inventory dataset loaded. Upload an inventory spreadsheet to populate warehouse stock.",
            "required_fields": [
                "product_id (string)",
                "product_name (string)",
                "category (string)",
                "available_quantity (integer >= 0)",
                "reorder_level (integer >= 0)",
                "unit_cost (float >= 0.0)",
                "warehouse (string)"
            ],
            "kpis": {
                "total_skus": 0,
                "total_units_on_hand": 0,
                "total_inventory_valuation": 0.0,
                "low_stock_sku_count": 0,
                "stockout_count": 0
            },
            "low_stock_items": [],
            "reorder_recommendations": [],
            "warehouse_breakdown": [],
            "category_breakdown": [],
            "all_items": [],
            "metadata": {
                "data_source": "PostgreSQL Core DB (fuji_flow)",
                "records_processed": 0,
                "calculation_method": "Inventory Stock Evaluation & Safety Stock Formula"
            }
        }

    # 1. Overall KPIs
    records = query.all()

    total_units = sum(r.available_quantity for r in records)
    total_valuation = sum(r.available_quantity * (r.unit_cost or 0.0) for r in records)
    
    # 2. Low-Stock Detection: available_quantity <= reorder_level
    low_stock_items = []
    stockout_count = 0
    reorder_recommendations = []

    for r in records:
        if r.available_quantity == 0:
            stockout_count += 1
            
        if r.available_quantity <= r.reorder_level:
            # Calculate urgency and reorder recommendation
            # Target safety stock = 2 * reorder_level
            suggested_reorder_qty = max(0, (2 * r.reorder_level) - r.available_quantity)
            estimated_cost = round(suggested_reorder_qty * (r.unit_cost or 0.0), 2)
            
            if r.available_quantity == 0:
                urgency = "Critical (Stockout)"
                urgency_badge = "critical"
            elif r.available_quantity <= (r.reorder_level * 0.5):
                urgency = "High Priority"
                urgency_badge = "high"
            else:
                urgency = "Standard Reorder"
                urgency_badge = "medium"

            item_dict = {
                "id": r.id,
                "product_id": r.product_id,
                "product_name": r.product_name,
                "category": r.category,
                "available_quantity": r.available_quantity,
                "reorder_level": r.reorder_level,
                "unit_cost": r.unit_cost,
                "stock_deficit": r.reorder_level - r.available_quantity,
                "warehouse": r.warehouse,
                "last_updated": r.last_updated.isoformat() if r.last_updated else None,
                "urgency": urgency,
                "urgency_badge": urgency_badge,
                "suggested_reorder_qty": suggested_reorder_qty,
                "estimated_reorder_cost": estimated_cost
            }
            low_stock_items.append(item_dict)
            reorder_recommendations.append(item_dict)

    # Sort low stock items by stockout first, then deficit
    low_stock_items.sort(key=lambda x: (x["available_quantity"], -x["stock_deficit"]))
    reorder_recommendations.sort(key=lambda x: -x["estimated_reorder_cost"])

    # 3. Warehouse Breakdown
    wh_agg = {}
    for r in records:
        wh = r.warehouse or "Central Fujiyoshida Hub"
        if wh not in wh_agg:
            wh_agg[wh] = {"warehouse": wh, "sku_count": 0, "total_units": 0, "total_valuation": 0.0, "low_stock_count": 0}
        wh_agg[wh]["sku_count"] += 1
        wh_agg[wh]["total_units"] += r.available_quantity
        wh_agg[wh]["total_valuation"] += r.available_quantity * (r.unit_cost or 0.0)
        if r.available_quantity <= r.reorder_level:
            wh_agg[wh]["low_stock_count"] += 1

    warehouse_breakdown = list(wh_agg.values())
    warehouse_breakdown.sort(key=lambda x: -x["total_valuation"])

    # 4. Category Breakdown
    cat_agg = {}
    for r in records:
        cat = r.category or "General"
        if cat not in cat_agg:
            cat_agg[cat] = {"category": cat, "sku_count": 0, "total_units": 0, "total_valuation": 0.0}
        cat_agg[cat]["sku_count"] += 1
        cat_agg[cat]["total_units"] += r.available_quantity
        cat_agg[cat]["total_valuation"] += r.available_quantity * (r.unit_cost or 0.0)

    category_breakdown = list(cat_agg.values())
    category_breakdown.sort(key=lambda x: -x["total_valuation"])

    # 5. Full Inventory Items (for detailed catalog review)
    all_items = [{
        "id": r.id,
        "product_id": r.product_id,
        "product_name": r.product_name,
        "category": r.category,
        "available_quantity": r.available_quantity,
        "reorder_level": r.reorder_level,
        "unit_cost": r.unit_cost,
        "warehouse": r.warehouse,
        "valuation": round(r.available_quantity * (r.unit_cost or 0.0), 2),
        "is_low_stock": r.available_quantity <= r.reorder_level,
        "last_updated": r.last_updated.isoformat() if r.last_updated else None
    } for r in records]

    return {
        "has_data": True,
        "kpis": {
            "total_skus": total_skus,
            "total_units_on_hand": total_units,
            "total_inventory_valuation": round(total_valuation, 2),
            "low_stock_sku_count": len(low_stock_items),
            "stockout_count": stockout_count,
            "reorder_budget_required": round(sum(i["estimated_reorder_cost"] for i in reorder_recommendations), 2)
        },
        "low_stock_items": low_stock_items,
        "reorder_recommendations": reorder_recommendations,
        "warehouse_breakdown": warehouse_breakdown,
        "category_breakdown": category_breakdown,
        "all_items": all_items,
        "metadata": {
            "data_source": "PostgreSQL Core DB (fuji_flow)",
            "records_processed": total_skus,
            "calculation_method": "Direct Stock Evaluation: available_quantity <= reorder_level condition"
        }
    }
