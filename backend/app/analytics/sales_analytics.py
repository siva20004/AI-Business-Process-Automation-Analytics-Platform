from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import BusinessTransaction

def compute_sales_analytics(
    db: Session,
    time_range: str = "30d",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    product_id: Optional[str] = None,
    status: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    
    # 1. Determine current reporting window
    period_days = 30
    if time_range == "today":
        window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        window_end = now
        period_days = 1
        period_label = "Today"
    elif time_range == "7d":
        window_start = now - timedelta(days=7)
        window_end = now
        period_days = 7
        period_label = "Last 7 Days"
    elif time_range == "30d":
        window_start = now - timedelta(days=30)
        window_end = now
        period_days = 30
        period_label = "Last 30 Days"
    elif time_range == "90d":
        window_start = now - timedelta(days=90)
        window_end = now
        period_days = 90
        period_label = "Last 90 Days"
    elif time_range == "custom" and start_date:
        window_start = start_date
        window_end = end_date or now
        period_days = max(1, (window_end - window_start).days)
        period_label = f"Custom ({window_start.strftime('%Y-%m-%d')} to {window_end.strftime('%Y-%m-%d')})"
    else:
        window_start = None
        window_end = now
        period_label = "All Time"

    # Base Query for Current Period
    query = db.query(BusinessTransaction)
    if window_start:
        query = query.filter(BusinessTransaction.transaction_date >= window_start)
    if window_end and time_range != "all":
        query = query.filter(BusinessTransaction.transaction_date <= window_end)
    if category and category != "all":
        query = query.filter(BusinessTransaction.category == category)
    if product_id and product_id != "all":
        query = query.filter(BusinessTransaction.product_id == product_id)
    if status and status != "all":
        query = query.filter(BusinessTransaction.status == status)

    total_tx_count = query.count()

    if total_tx_count == 0:
        return {
            "has_data": False,
            "message": "No transaction records match the specified filters.",
            "kpis": {
                "total_sales": 0.0,
                "total_transactions": 0,
                "average_transaction_value": 0.0,
                "total_quantity_sold": 0,
                "sales_growth_pct": None
            },
            "daily_trends": [],
            "category_performance": [],
            "top_products": [],
            "metadata": {
                "data_source": "PostgreSQL Core DB (fuji_flow)",
                "reporting_period": period_label,
                "records_processed": 0,
                "calculation_method": "SQL Aggregate: SUM(total_amount), AVG(total_amount), SUM(quantity)"
            }
        }

    # Aggregate current period KPIs
    agg = query.with_entities(
        func.coalesce(func.sum(BusinessTransaction.total_amount), 0.0).label("total_sales"),
        func.coalesce(func.avg(BusinessTransaction.total_amount), 0.0).label("avg_value"),
        func.coalesce(func.sum(BusinessTransaction.quantity), 0).label("total_qty")
    ).first()

    total_sales = float(agg.total_sales) if agg else 0.0
    avg_value = float(agg.avg_value) if agg else 0.0
    total_qty = int(agg.total_qty) if agg else 0

    # 2. Period-over-Period comparison (% growth)
    sales_growth_pct = None
    if window_start:
        prev_window_start = window_start - timedelta(days=period_days)
        prev_window_end = window_start
        prev_query = db.query(BusinessTransaction).filter(
            BusinessTransaction.transaction_date >= prev_window_start,
            BusinessTransaction.transaction_date < prev_window_end
        )
        if category and category != "all":
            prev_query = prev_query.filter(BusinessTransaction.category == category)
        prev_sales = prev_query.with_entities(
            func.coalesce(func.sum(BusinessTransaction.total_amount), 0.0)
        ).scalar() or 0.0
        prev_sales = float(prev_sales)
        if prev_sales > 0:
            sales_growth_pct = round(((total_sales - prev_sales) / prev_sales) * 100, 1)

    # 3. Daily Sales Trends
    daily_query = query.with_entities(
        func.date(BusinessTransaction.transaction_date).label("date"),
        func.sum(BusinessTransaction.total_amount).label("sales"),
        func.count(BusinessTransaction.id).label("transactions"),
        func.sum(BusinessTransaction.quantity).label("quantity")
    ).group_by(func.date(BusinessTransaction.transaction_date)).order_by("date").all()

    daily_trends = [{
        "date": str(d.date),
        "sales": round(float(d.sales), 2),
        "transactions": int(d.transactions),
        "quantity": int(d.quantity),
        "average_basket": round(float(d.sales) / int(d.transactions), 2) if int(d.transactions) > 0 else 0.0
    } for d in daily_query]

    # 4. Category Performance
    cat_query = query.with_entities(
        BusinessTransaction.category,
        func.sum(BusinessTransaction.total_amount).label("revenue"),
        func.count(BusinessTransaction.id).label("tx_count"),
        func.sum(BusinessTransaction.quantity).label("units_sold")
    ).group_by(BusinessTransaction.category).order_by(desc("revenue")).all()

    category_performance = [{
        "category": str(c.category),
        "revenue": round(float(c.revenue), 2),
        "transactions": int(c.tx_count),
        "units_sold": int(c.units_sold),
        "percentage": round((float(c.revenue) / total_sales) * 100, 2) if total_sales > 0 else 0.0
    } for c in cat_query]

    # 5. Top Products Performance
    prod_query = query.with_entities(
        BusinessTransaction.product_id,
        BusinessTransaction.product_name,
        BusinessTransaction.category,
        func.sum(BusinessTransaction.total_amount).label("revenue"),
        func.sum(BusinessTransaction.quantity).label("units_sold"),
        func.count(BusinessTransaction.id).label("tx_count")
    ).group_by(
        BusinessTransaction.product_id,
        BusinessTransaction.product_name,
        BusinessTransaction.category
    ).order_by(desc("revenue")).limit(10).all()

    top_products = [{
        "product_id": str(p.product_id),
        "product_name": str(p.product_name or p.product_id),
        "category": str(p.category),
        "revenue": round(float(p.revenue), 2),
        "units_sold": int(p.units_sold),
        "transactions": int(p.tx_count),
        "percentage_of_sales": round((float(p.revenue) / total_sales) * 100, 2) if total_sales > 0 else 0.0
    } for p in prod_query]

    return {
        "has_data": True,
        "kpis": {
            "total_sales": round(total_sales, 2),
            "total_transactions": total_tx_count,
            "average_transaction_value": round(avg_value, 2),
            "total_quantity_sold": total_qty,
            "sales_growth_pct": sales_growth_pct
        },
        "daily_trends": daily_trends,
        "category_performance": category_performance,
        "top_products": top_products,
        "metadata": {
            "data_source": "PostgreSQL Core DB (fuji_flow)",
            "reporting_period": period_label,
            "records_processed": total_tx_count,
            "calculation_method": "SQL Aggregation: SUM(total_amount), AVG(total_amount), SUM(quantity), Category/Product GROUP BY"
        }
    }
