import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.core.security import get_password_hash
from app.api.deps import get_current_user
from app.models.all_models import User, Role, AuditLog

logger = logging.getLogger("fuji_flow.api.users")

router = APIRouter()

class UserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "analyst" # "admin", "analyst", "viewer"

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

@router.get("", response_model=List[dict])
def list_system_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Lists all platform users with role attribution and status.
    """
    users = db.query(User).order_by(desc(User.created_at)).all()
    items = []
    for u in users:
        items.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.name if u.role else "analyst",
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return items

@router.post("", status_code=status.HTTP_201_CREATED)
def create_system_user(
    req: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new Fuji Kyuko platform account with role assignment.
    """
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered in FUJI FLOW.")

    role_obj = db.query(Role).filter(Role.name == req.role.lower()).first()
    if not role_obj:
        role_obj = Role(name=req.role.lower(), description=f"Fuji Kyuko {req.role.capitalize()} Role")
        db.add(role_obj)
        db.commit()
        db.refresh(role_obj)

    new_user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role_id=role_obj.id,
        is_active=True,
        is_superuser=(req.role.lower() == "admin")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        action="CREATE_USER",
        entity_type="user",
        entity_id=str(new_user.id),
        details={"email": req.email, "role": req.role}
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"User {req.email} created successfully.",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": req.role
    }

@router.patch("/{user_id}/status")
def toggle_user_status(
    user_id: int,
    req: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Activates or deactivates a user account.
    """
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if u.email == current_user.email and not req.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own administrative account.")

    u.is_active = req.is_active
    db.commit()

    return {
        "status": "success",
        "user_id": u.id,
        "email": u.email,
        "is_active": u.is_active
    }
