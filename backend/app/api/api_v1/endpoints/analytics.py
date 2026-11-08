from datetime import datetime
from typing import Optional, Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from app.database.session import get_db
from app.models import BusinessTransaction, InventoryRecord
from app.api.deps import get_current_user
from app.analytics.sales_analytics import compute_sales_analytics
from app.analytics.inventory_analytics import compute_inventory_analytics

router = APIRouter()

@router.get("/sales")
def get_sales_analytics(
    time_range: Literal["today", "7d", "30d", "90d", "all", "custom"] = Query("30d"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    product_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """
    Computes real sales analytics from PostgreSQL records:
    total revenue, ATV, units sold, daily time series trends, category distribution, top products.
    """
    return compute_sales_analytics(
        db=db,
        time_range=time_range,
        start_date=start_date,
        end_date=end_date,
        category=category,
        product_id=product_id,
        status=status
    )

@router.get("/inventory")
def get_inventory_analytics(
    warehouse: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """
    Computes real inventory metrics from PostgreSQL records:
    SKU totals, stock count, valuation, low stock conditions (qty <= reorder_level), and reorder recommendations.
    """
    return compute_inventory_analytics(
        db=db,
        warehouse=warehouse,
        category=category
    )

@router.get("/filters")
def get_analytics_filter_options(
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    """
    Returns actual distinct categories, products, and warehouses from the database
    to dynamically populate frontend filter selectors.
    """
    sales_cats = [r[0] for r in db.query(BusinessTransaction.category).distinct().all() if r[0]]
    inv_cats = [r[0] for r in db.query(InventoryRecord.category).distinct().all() if r[0]]
    all_categories = sorted(list(set(sales_cats + inv_cats)))

    products = [
        {"id": r[0], "name": r[1] or r[0]}
        for r in db.query(BusinessTransaction.product_id, BusinessTransaction.product_name).distinct().all()
        if r[0]
    ]

    warehouses = [r[0] for r in db.query(InventoryRecord.warehouse).distinct().all() if r[0]]

    return {
        "categories": all_categories,
        "products": products,
        "warehouses": sorted(warehouses),
        "statuses": ["completed", "refunded", "cancelled"]
    }
