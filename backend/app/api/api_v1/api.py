from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    auth,
    dashboard,
    data_sources,
    health,
    uploads,
    analytics,
    workflows,
    anomalies,
    insights,
    reports,
    email,
    users,
    settings
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Executive Dashboard"])
api_router.include_router(data_sources.router, prefix="/data-sources", tags=["Data Sources"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Data Upload & Validation"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Sales & Inventory Analytics"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["Workflow Automation & History"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["AI Anomaly Detection"])
api_router.include_router(insights.router, prefix="/insights", tags=["AI Business Insights"])
api_router.include_router(reports.router, prefix="/reports", tags=["Report Center"])
api_router.include_router(email.router, prefix="/email", tags=["Email Automation"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings & Governance"])
