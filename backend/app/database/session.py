import logging
import time
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("fuji_flow.database")

Base = declarative_base()

def init_engine():
    try:
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            
        # Primary: PostgreSQL
        pg_engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected successfully to PostgreSQL at {db_url.split('@')[-1]}")
        return pg_engine, "postgresql"
    except Exception as e:
        logger.warning(f"Could not connect to primary PostgreSQL ({e}). Using SQLite fallback.")
        sqlite_engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
            echo=False
        )
        return sqlite_engine, "sqlite"

engine, DB_DIALECT = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> dict:
    t0 = time.time()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            latency_ms = round((time.time() - t0) * 1000, 2)
            return {
                "status": "connected",
                "healthy": True,
                "dialect": DB_DIALECT,
                "latency_ms": latency_ms,
                "database": "fuji_flow" if DB_DIALECT == "postgresql" else "fuji_flow.db",
                "error": None
            }
    except Exception as e:
        return {
            "status": "disconnected",
            "healthy": False,
            "dialect": DB_DIALECT,
            "latency_ms": None,
            "database": None,
            "error": str(e)
        }
