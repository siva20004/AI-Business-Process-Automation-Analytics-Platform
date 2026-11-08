import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath("backend"))

from app.services.init_db import init_db
from app.database.session import SessionLocal, DB_DIALECT
from app.models import User, Role, DataSource

print(f"Initializing database using dialect: {DB_DIALECT}")
init_db()

db = SessionLocal()
roles = db.query(Role).all()
users = db.query(User).all()
sources = db.query(DataSource).all()

print(f"Successfully connected to {DB_DIALECT}!")
print(f"Roles count: {len(roles)} -> {[r.name for r in roles]}")
print(f"Users count: {len(users)} -> {[u.email for u in users]}")
print(f"Data Sources: {len(sources)} -> {[s.name for s in sources]}")
db.close()
