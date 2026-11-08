import logging
from sqlalchemy.orm import Session
from app.database.session import engine, Base, SessionLocal
from app.models import Role, User, DataSource, AuditLog
from app.core.security import get_password_hash
from app.core.config import settings

logger = logging.getLogger("fuji_flow.init_db")

def init_db() -> None:
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")

    db: Session = SessionLocal()
    try:
        # Seed Roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(
                name="admin",
                description="Enterprise Administrator - Full configuration and management access",
                permissions=["*"]
            )
            db.add(admin_role)
            db.flush()

        analyst_role = db.query(Role).filter(Role.name == "analyst").first()
        if not analyst_role:
            analyst_role = Role(
                name="analyst",
                description="Business Process Analyst - Access to data, workflows, analytics and reports",
                permissions=["read", "write", "execute_workflow", "generate_reports", "review_anomalies"]
            )
            db.add(analyst_role)
            db.flush()

        viewer_role = db.query(Role).filter(Role.name == "viewer").first()
        if not viewer_role:
            viewer_role = Role(
                name="viewer",
                description="Executive / Read-only Viewer",
                permissions=["read"]
            )
            db.add(viewer_role)
            db.flush()

        # Seed Default Admin User
        admin_user = db.query(User).filter(User.email == settings.DEFAULT_ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                full_name=settings.DEFAULT_ADMIN_NAME,
                is_active=True,
                is_superuser=True,
                role_id=admin_role.id
            )
            db.add(admin_user)
            logger.info(f"Default admin user created: {settings.DEFAULT_ADMIN_EMAIL}")

        # Seed Default Analyst User
        analyst_user = db.query(User).filter(User.email == settings.DEFAULT_ANALYST_EMAIL).first()
        if not analyst_user:
            analyst_user = User(
                email=settings.DEFAULT_ANALYST_EMAIL,
                hashed_password=get_password_hash(settings.DEFAULT_ANALYST_PASSWORD),
                full_name=settings.DEFAULT_ANALYST_NAME,
                is_active=True,
                is_superuser=False,
                role_id=analyst_role.id
            )
            db.add(analyst_user)
            logger.info(f"Default analyst user created: {settings.DEFAULT_ANALYST_EMAIL}")

        # Seed Default Data Sources (configured repositories for real uploads/integrations)
        ds_file = db.query(DataSource).filter(DataSource.name == "Local File Repository (CSV/Excel)").first()
        if not ds_file:
            ds_file = DataSource(
                name="Local File Repository (CSV/Excel)",
                source_type="file_system",
                connection_config={"path": "./data/uploads", "supported_formats": ["csv", "xlsx", "xls", "json"]},
                status="connected",
                record_count=0,
                schema_info={"description": "Active staging directory for enterprise business files"}
            )
            db.add(ds_file)

        ds_pg = db.query(DataSource).filter(DataSource.name.like("%Core PostgreSQL DB%")).first()
        if not ds_pg:
            ds_pg = DataSource(
                name="Primary Core PostgreSQL DB",
                source_type="postgresql",
                connection_config={"server": "localhost", "port": 5432, "database": "fuji_flow"},
                status="connected",
                record_count=0,
                schema_info={"description": "Transactional and analytical store"}
            )
            db.add(ds_pg)

        # Audit Log
        db.add(AuditLog(
            user_email="system",
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            entity_id="fuji_flow_init",
            details={"message": "System database initialized and seeded with baseline administrative structure."}
        ))

        db.commit()
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during init_db: {e}")
        raise
    finally:
        db.close()
