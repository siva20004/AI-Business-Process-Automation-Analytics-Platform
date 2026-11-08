import logging
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.all_models import User
from app.reporting.email_service import EmailService

logger = logging.getLogger("fuji_flow.api.email")

router = APIRouter()

class EmailPreviewRequest(BaseModel):
    template_type: Literal["daily_briefing", "inventory_alert", "anomaly_audit"]
    recipients: List[str]
    custom_note: Optional[str] = None
    report_id: Optional[int] = None

class EmailSendRequest(BaseModel):
    template_type: Literal["daily_briefing", "inventory_alert", "anomaly_audit"]
    recipients: List[str]
    custom_note: Optional[str] = None
    report_id: Optional[int] = None

@router.get("/config")
def get_smtp_configuration(_current_user: User = Depends(get_current_user)):
    """
    Returns active SMTP configuration status.
    """
    return EmailService.get_smtp_config()

@router.post("/preview")
def preview_email_notification(
    req: EmailPreviewRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Renders preview of subject, HTML body, and attachment before user confirms dispatch.
    """
    if not req.recipients:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one recipient is required.")

    try:
        return EmailService.preview_email(
            db=db,
            template_type=req.template_type,
            recipients=req.recipients,
            custom_note=req.custom_note,
            report_id=req.report_id
        )
    except Exception as e:
        logger.error(f"Email preview generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email preview failed: {str(e)}"
        )

@router.post("/send")
def send_email_notification(
    req: EmailSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dispatches email notification with user confirmation and audit logging.
    """
    if not req.recipients:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one recipient is required.")

    try:
        return EmailService.send_email(
            db=db,
            template_type=req.template_type,
            recipients=req.recipients,
            custom_note=req.custom_note,
            report_id=req.report_id,
            user_email=current_user.email
        )
    except Exception as e:
        logger.error(f"Failed to dispatch email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dispatch failed: {str(e)}"
        )

@router.get("/history")
def get_email_dispatch_history(_current_user: User = Depends(get_current_user)):
    """
    Retrieves history of dispatched emails and audit trails.
    """
    return EmailService.get_dispatch_history()
