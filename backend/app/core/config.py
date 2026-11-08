import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FUJI FLOW"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Database (PostgreSQL with SQLite fallback)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/fuji_flow"
    SQLITE_FALLBACK_URL: str = "sqlite:///./data/fuji_flow.db"
    
    # Auth
    SECRET_KEY: str = "fuji-flow-secret-key-enterprise-production-secure-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for enterprise workday
    
    # Defaults
    DEFAULT_ADMIN_EMAIL: str = "admin@fujikyuko.co.jp"
    DEFAULT_ADMIN_PASSWORD: str = "FujiFlow2026!"
    DEFAULT_ADMIN_NAME: str = "System Administrator"
    
    DEFAULT_ANALYST_EMAIL: str = "analyst@fujikyuko.co.jp"
    DEFAULT_ANALYST_PASSWORD: str = "FujiFlow2026!"
    DEFAULT_ANALYST_NAME: str = "Senior Business Analyst"
    
    # Storage
    UPLOAD_DIR: str = "./data/uploads"
    PROCESSED_DIR: str = "./data/processed"
    REPORTS_DIR: str = "./data/reports"
    RAW_DIR: str = "./data/raw"

    # SMTP & Email Automation
    SMTP_SERVER: str = "smtp.fujikyuko.co.jp"
    SMTP_PORT: int = 587
    SMTP_USER: str = "automation@fujikyuko.co.jp"
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "fuji-flow-alerts@fujikyuko.co.jp"
    EMAILS_FROM_NAME: str = "FUJI FLOW Automation Engine"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
for path in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.REPORTS_DIR, settings.RAW_DIR]:
    os.makedirs(path, exist_ok=True)
