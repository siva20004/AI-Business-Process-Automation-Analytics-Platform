from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, AuditLog
from app.schemas.all_schemas import UserLogin, Token, UserOut
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.add(AuditLog(
        user_email=user.email,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details={"ip": "localhost"}
    ))
    db.commit()
    db.refresh(user)

    role_name = user.role.name if user.role else "analyst"
    access_token = create_access_token(
        subject=user.email,
        role=role_name
    )

    user_out = UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        last_login=user.last_login
    )

    return Token(access_token=access_token, token_type="bearer", user=user_out)

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    role_name = current_user.role.name if current_user.role else "analyst"
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=role_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        last_login=current_user.last_login
    )
