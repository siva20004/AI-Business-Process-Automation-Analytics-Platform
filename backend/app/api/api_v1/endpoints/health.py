from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.database.session import check_db_connection
from app.schemas.all_schemas import HealthResponse, DatabaseHealth

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    db_info = check_db_connection()
    return HealthResponse(
        status="healthy" if db_info["healthy"] else "degraded",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=DatabaseHealth(
            status=db_info["status"],
            healthy=db_info["healthy"],
            dialect=db_info["dialect"],
            latency_ms=db_info["latency_ms"],
            database=db_info["database"],
            error=db_info["error"]
        )
    )
