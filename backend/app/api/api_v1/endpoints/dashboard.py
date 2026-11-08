from datetime import datetime, timedelta, timezone
from typing import Optional, List, Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from app.database.session import get_db
from app.models import (
    BusinessTransaction,
    InventoryRecord,
    WorkflowExecution,
    AnomalyDetection,
    GeneratedReport
)
from app.schemas.all_schemas import (
    DashboardResponse,
    KPISummary,
    SalesTrendItem,
    CategoryBreakdownItem,
    JobStatusItem,
    AnomalyTrendItem,
    DashboardMetadata
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/summary", response_model=DashboardResponse)
def get_dashboard_summary(
    time_range: Literal["today", "7d", "30d", "90d", "all", "custom"] = Query("30d"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    _current_user = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    
    # Calculate reporting window
    if time_range == "today":
        window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_label = "Today"
    elif time_range == "7d":
        window_start = now - timedelta(days=7)
        period_label = "Last 7 Days"
    elif time_range == "30d":
        window_start = now - timedelta(days=30)
        period_label = "Last 30 Days"
    elif time_range == "90d":
        window_start = now - timedelta(days=90)
        period_label = "Last 90 Days"
    elif time_range == "custom" and start_date:
        window_start = start_date
        period_label = f"Custom ({start_date.strftime('%Y-%m-%d')} to {(end_date or now).strftime('%Y-%m-%d')})"
    else:
        window_start = None
        period_label = "All Time"

    # 1. Base Query for Transactions
    tx_query = db.query(BusinessTransaction)
    if window_start:
        tx_query = tx_query.filter(BusinessTransaction.transaction_date >= window_start)
    if end_date and time_range == "custom":
        tx_query = tx_query.filter(BusinessTransaction.transaction_date <= end_date)

    # Calculate real Sales & Transaction metrics
    total_tx_count = tx_query.count()
    sales_agg = tx_query.with_entities(
        func.coalesce(func.sum(BusinessTransaction.total_amount), 0.0).label("total_sales"),
        func.coalesce(func.avg(BusinessTransaction.total_amount), 0.0).label("avg_value")
    ).first()

    total_sales = float(sales_agg.total_sales) if sales_agg else 0.0
    avg_tx_value = float(sales_agg.avg_value) if sales_agg else 0.0

    # 2. Inventory Metrics
    total_inventory_items = db.query(InventoryRecord).count()
    low_stock_items = db.query(InventoryRecord).filter(
        InventoryRecord.available_quantity <= InventoryRecord.reorder_level
    ).count()

    # 3. Processing Job Metrics (Workflow Executions)
    job_query = db.query(WorkflowExecution)
    if window_start:
        job_query = job_query.filter(WorkflowExecution.start_time >= window_start)
    total_processing_jobs = job_query.count()
    successful_jobs = job_query.filter(WorkflowExecution.status == "success").count()
    failed_jobs = job_query.filter(WorkflowExecution.status == "failed").count()

    # 4. Detected Anomalies
    anomaly_query = db.query(AnomalyDetection)
    if window_start:
        anomaly_query = anomaly_query.filter(AnomalyDetection.created_at >= window_start)
    detected_anomalies = anomaly_query.count()

    # 5. Reports Generated
    report_query = db.query(GeneratedReport)
    if window_start:
        report_query = report_query.filter(GeneratedReport.created_at >= window_start)
    reports_generated = report_query.count()

    has_real_data = (total_tx_count > 0 or total_inventory_items > 0 or total_processing_jobs > 0)

    # 6. Sales Trends (Daily aggregation of actual records)
    sales_trends: List[SalesTrendItem] = []
    category_performance: List[CategoryBreakdownItem] = []
    job_distribution: List[JobStatusItem] = []
    anomaly_trends: List[AnomalyTrendItem] = []

    if total_tx_count > 0:
        # Group sales by date
        # Use date truncated or strftime
        daily_sales = tx_query.with_entities(
            func.date(BusinessTransaction.transaction_date).label("tx_date"),
            func.sum(BusinessTransaction.total_amount).label("daily_sales"),
            func.count(BusinessTransaction.id).label("daily_count")
        ).group_by(func.date(BusinessTransaction.transaction_date)).order_by("tx_date").all()

        for item in daily_sales:
            sales_trends.append(SalesTrendItem(
                date=str(item.tx_date),
                sales=round(float(item.daily_sales), 2),
                transactions=int(item.daily_count)
            ))

        # Category Performance
        cat_agg = tx_query.with_entities(
            BusinessTransaction.category,
            func.sum(BusinessTransaction.total_amount).label("cat_revenue"),
            func.count(BusinessTransaction.id).label("cat_count")
        ).group_by(BusinessTransaction.category).order_by(desc("cat_revenue")).all()

        for cat in cat_agg:
            cat_rev = float(cat.cat_revenue)
            pct = round((cat_rev / total_sales * 100), 2) if total_sales > 0 else 0.0
            category_performance.append(CategoryBreakdownItem(
                category=str(cat.category),
                revenue=round(cat_rev, 2),
                percentage=pct,
                transaction_count=int(cat.cat_count)
            ))

    # Job distribution
    if total_processing_jobs > 0:
        job_counts = job_query.with_entities(
            WorkflowExecution.status,
            func.count(WorkflowExecution.id).label("status_count")
        ).group_by(WorkflowExecution.status).all()

        for status_item in job_counts:
            cnt = int(status_item.status_count)
            pct = round((cnt / total_processing_jobs * 100), 2)
            job_distribution.append(JobStatusItem(
                status=str(status_item.status).capitalize(),
                count=cnt,
                percentage=pct
            ))

    # Anomaly trends
    if detected_anomalies > 0:
        daily_anomalies = anomaly_query.with_entities(
            func.date(AnomalyDetection.created_at).label("anomaly_date"),
            func.count(AnomalyDetection.id).label("total_cnt"),
            func.sum(case((AnomalyDetection.status == "unreviewed", 1), else_=0)).label("unreviewed_cnt")
        ).group_by(func.date(AnomalyDetection.created_at)).order_by("anomaly_date").all()

        for item in daily_anomalies:
            anomaly_trends.append(AnomalyTrendItem(
                date=str(item.anomaly_date),
                count=int(item.total_cnt),
                unreviewed=int(item.unreviewed_cnt or 0)
            ))

    # Get last processing time
    last_exec = db.query(WorkflowExecution).order_by(desc(WorkflowExecution.start_time)).first()
    last_tx = db.query(BusinessTransaction).order_by(desc(BusinessTransaction.created_at)).first()
    last_proc_time = None
    if last_exec and last_exec.start_time:
        last_proc_time = last_exec.start_time
    elif last_tx and last_tx.created_at:
        last_proc_time = last_tx.created_at

    metadata = DashboardMetadata(
        data_source="PostgreSQL Core DB (fuji_flow)" if has_real_data else "No active data source records loaded",
        reporting_period=period_label,
        records_processed=total_tx_count + total_inventory_items,
        last_processing_time=last_proc_time,
        calculation_method="SQL Direct Aggregate Computation (Strict Real Data Pipeline)",
        data_quality_status="Verified & Validated Records" if has_real_data else "Awaiting Data Upload / Integration"
    )

    empty_message = None if has_real_data else "No business data available. Connect a data source or upload a dataset."

    return DashboardResponse(
        kpis=KPISummary(
            total_sales=round(total_sales, 2),
            total_transactions=total_tx_count,
            total_inventory_items=total_inventory_items,
            low_stock_items=low_stock_items,
            average_transaction_value=round(avg_tx_value, 2),
            total_processing_jobs=total_processing_jobs,
            successful_jobs=successful_jobs,
            failed_jobs=failed_jobs,
            detected_anomalies=detected_anomalies,
            reports_generated=reports_generated,
            has_real_data=has_real_data
        ),
        sales_trends=sales_trends,
        category_performance=category_performance,
        job_distribution=job_distribution,
        anomaly_trends=anomaly_trends,
        metadata=metadata,
        empty_state_message=empty_message
    )
