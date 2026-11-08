import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.services.init_db import init_db
from app.api.api_v1.api import api_router
from app.database.session import check_db_connection
from app.schemas.all_schemas import HealthResponse, DatabaseHealth
from app.automation.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fuji_flow")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing FUJI FLOW Business Automation Engine...")
    try:
        init_db()
        logger.info("FUJI FLOW Database and initial seed state ready.")
        start_scheduler()
    except Exception as e:
        logger.error(f"Failed to initialize database/scheduler: {e}")
    yield
    # Shutdown actions
    shutdown_scheduler()
    logger.info("FUJI FLOW server shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FUJI FLOW - AI-Based Business Process Automation & Analytics Platform for Fuji Kyuko Co., Ltd.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; in production configured from settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health check endpoint (as specified: http://localhost:8000/health)
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def root_health():
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

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
