from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # "admin", "analyst", "viewer"
    description = Column(String(255), nullable=True)
    permissions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    role = relationship("Role", back_populates="users")
    data_imports = relationship("DataImport", back_populates="uploaded_by_user")

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False) # "csv", "excel", "json", "postgresql", "rest_api"
    connection_config = Column(JSON, default=dict)
    status = Column(String(50), default="configured") # "connected", "error", "disconnected", "configured"
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    record_count = Column(Integer, default=0)
    schema_info = Column(JSON, default=dict)
    error_info = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class DataImport(Base):
    __tablename__ = "data_imports"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_format = Column(String(20), nullable=False) # "csv", "xlsx", "xls", "json"
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(50), default="pending") # "pending", "validating", "cleaned", "imported", "failed"
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    cleaned_file_path = Column(String(500), nullable=True)
    raw_file_path = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    uploaded_by_user = relationship("User", back_populates="data_imports")
    validation_issues = relationship("ValidationIssue", back_populates="data_import", cascade="all, delete-orphan")

class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(Integer, primary_key=True, index=True)
    import_id = Column(Integer, ForeignKey("data_imports.id"), nullable=False)
    row_number = Column(Integer, nullable=False)
    field_name = Column(String(100), nullable=False)
    invalid_value = Column(Text, nullable=True)
    error_message = Column(Text, nullable=False)
    severity = Column(String(20), default="error") # "error", "warning"
    created_at = Column(DateTime(timezone=True), default=utcnow)

    data_import = relationship("DataImport", back_populates="validation_issues")

class BusinessTransaction(Base):
    __tablename__ = "business_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    transaction_date = Column(DateTime(timezone=True), index=True, nullable=False)
    product_id = Column(String(100), index=True, nullable=False)
    product_name = Column(String(255), nullable=True)
    category = Column(String(100), index=True, nullable=False) # e.g., Transportation, Tourism, Hotel, Amusement, Food, Retail
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    business_unit = Column(String(100), default="Fuji Kyuko Co., Ltd.")
    status = Column(String(50), default="completed") # "completed", "refunded", "cancelled"
    is_flagged_anomaly = Column(Boolean, default=False)
    import_id = Column(Integer, ForeignKey("data_imports.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    unit_cost = Column(Float, default=0.0)
    unit_price = Column(Float, default=0.0)
    reorder_level = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(100), index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    reorder_level = Column(Integer, default=10)
    unit_cost = Column(Float, default=0.0)
    warehouse = Column(String(100), nullable=False, default="Central Warehouse Fujiyoshida")
    last_updated = Column(DateTime(timezone=True), default=utcnow)
    import_id = Column(Integer, ForeignKey("data_imports.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), default="manual") # "manual", "file_upload", "scheduled", "api"
    schedule_cron = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    steps_config = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    execution_id = Column(String(100), unique=True, index=True, nullable=False)
    trigger_type = Column(String(50), nullable=False)
    status = Column(String(50), default="pending") # "pending", "running", "success", "failed"
    start_time = Column(DateTime(timezone=True), default=utcnow)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    records_processed = Column(Integer, default=0)
    failed_step = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    step_details = Column(JSON, default=list)

    workflow = relationship("Workflow", back_populates="executions")

class AnomalyDetection(Base):
    __tablename__ = "anomaly_detections"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(100), index=True, nullable=False)
    record_type = Column(String(50), default="transaction") # "transaction", "inventory"
    detection_method = Column(String(100), nullable=False) # "Isolation Forest", "Z-Score (>3.0)", "Historical Baseline Deviation"
    observed_value = Column(Float, nullable=False)
    reference_baseline = Column(Float, nullable=True)
    reason = Column(Text, nullable=False)
    raw_record = Column(JSON, default=dict)
    status = Column(String(50), default="unreviewed") # "unreviewed", "reviewed", "dismissed", "escalated"
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False) # "daily_sales", "weekly_business", "inventory_status", "anomaly_audit"
    reporting_period = Column(String(100), nullable=False)
    data_source = Column(String(100), nullable=False)
    records_analyzed = Column(Integer, default=0)
    file_path = Column(String(500), nullable=False)
    file_format = Column(String(20), nullable=False) # "pdf", "csv", "xlsx"
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
