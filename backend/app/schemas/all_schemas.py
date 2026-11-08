from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- AUTH SCHEMAS ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_superuser: bool
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

# --- HEALTH & DIAGNOSTIC SCHEMAS ---
class DatabaseHealth(BaseModel):
    status: str
    healthy: bool
    dialect: str
    latency_ms: Optional[float] = None
    database: Optional[str] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: datetime
    database: DatabaseHealth

# --- DASHBOARD KPI & ANALYTICS SCHEMAS ---
class KPISummary(BaseModel):
    total_sales: float = 0.0
    total_transactions: int = 0
    total_inventory_items: int = 0
    low_stock_items: int = 0
    average_transaction_value: float = 0.0
    total_processing_jobs: int = 0
    successful_jobs: int = 0
    failed_jobs: int = 0
    detected_anomalies: int = 0
    reports_generated: int = 0
    has_real_data: bool = False

class SalesTrendItem(BaseModel):
    date: str
    sales: float
    transactions: int

class CategoryBreakdownItem(BaseModel):
    category: str
    revenue: float
    percentage: float
    transaction_count: int

class JobStatusItem(BaseModel):
    status: str
    count: int
    percentage: float

class AnomalyTrendItem(BaseModel):
    date: str
    count: int
    unreviewed: int

class DashboardMetadata(BaseModel):
    data_source: str
    reporting_period: str
    records_processed: int
    last_processing_time: Optional[datetime] = None
    calculation_method: str
    data_quality_status: str

class DashboardResponse(BaseModel):
    kpis: KPISummary
    sales_trends: List[SalesTrendItem] = []
    category_performance: List[CategoryBreakdownItem] = []
    job_distribution: List[JobStatusItem] = []
    anomaly_trends: List[AnomalyTrendItem] = []
    metadata: DashboardMetadata
    empty_state_message: Optional[str] = None

# --- DATA SOURCE SCHEMAS ---
class DataSourceBase(BaseModel):
    name: str
    source_type: str # "csv", "excel", "json", "postgresql", "rest_api"
    connection_config: Dict[str, Any] = {}

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceOut(DataSourceBase):
    id: int
    status: str
    last_sync_at: Optional[datetime] = None
    record_count: int = 0
    schema_info: Dict[str, Any] = {}
    error_info: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DataSourceTestResult(BaseModel):
    success: bool
    status: str
    message: str
    latency_ms: Optional[float] = None
    records_found: Optional[int] = None
