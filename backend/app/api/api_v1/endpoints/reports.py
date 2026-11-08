import os
import logging
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.all_models import GeneratedReport, User
from app.reporting.generator import ReportGenerator

logger = logging.getLogger("fuji_flow.api.reports")

router = APIRouter()

class ReportGenerateRequest(BaseModel):
    report_type: Literal["daily_sales", "inventory_status", "anomaly_audit", "executive_briefing"]
    file_format: Literal["pdf", "xlsx", "csv"] = "pdf"
    time_range: Literal["today", "7d", "30d", "90d", "all"] = "all"

@router.post("/generate")
def generate_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates an audit-ready PDF, Excel, or CSV report grounded in real PostgreSQL records.
    """
    try:
        rep = ReportGenerator.generate_report(
            db=db,
            report_type=req.report_type,
            file_format=req.file_format,
            time_range=req.time_range,
            user_email=current_user.email
        )
        return {
            "status": "success",
            "report_id": rep.id,
            "title": rep.title,
            "report_type": rep.report_type,
            "file_format": rep.file_format,
            "file_path": rep.file_path,
            "records_analyzed": rep.records_analyzed,
            "created_at": rep.created_at.isoformat() if rep.created_at else None,
            "download_url": f"/api/v1/reports/{rep.id}/download"
        }
    except Exception as e:
        logger.error(f"Failed to generate report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report compilation failed: {str(e)}"
        )

@router.get("", response_model=List[dict])
def list_reports(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Lists all generated corporate reports.
    """
    reports = db.query(GeneratedReport).order_by(desc(GeneratedReport.created_at)).limit(limit).all()
    items = []
    for r in reports:
        filename = os.path.basename(r.file_path) if r.file_path else "report"
        file_exists = os.path.exists(r.file_path) if r.file_path else False
        items.append({
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "reporting_period": r.reporting_period,
            "data_source": r.data_source,
            "records_analyzed": r.records_analyzed,
            "file_format": r.file_format,
            "filename": filename,
            "file_exists": file_exists,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "download_url": f"/api/v1/reports/{r.id}/download"
        })
    return items

@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Directly streams the generated report file (PDF, Excel, or CSV) with proper MIME types.
    """
    rep = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report record not found.")

    if not os.path.exists(rep.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found on disk.")

    media_types = {
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv; charset=utf-8"
    }
    media_type = media_types.get(rep.file_format.lower(), "application/octet-stream")
    filename = os.path.basename(rep.file_path)

    return FileResponse(
        path=rep.file_path,
        media_type=media_type,
        filename=filename
    )
