import logging
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.all_models import AnomalyDetection, User
from app.anomaly_detection.detector import AnomalyEngine

logger = logging.getLogger("fuji_flow.api.anomalies")

router = APIRouter()

class ReviewRequest(BaseModel):
    status: Literal["reviewed", "dismissed", "escalated", "unreviewed"]
    notes: Optional[str] = None

class AnomalyScanResponse(BaseModel):
    status: str
    duration_seconds: float
    total_analyzed: int
    new_anomalies: int
    total_anomalies: int
    unreviewed_anomalies: int
    scan_timestamp: str

@router.post("/scan", response_model=AnomalyScanResponse)
def trigger_anomaly_scan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an on-demand anomaly scan using statistical Z-Score, IQR, and Scikit-Learn Isolation Forest.
    Grounded exclusively in actual PostgreSQL records.
    """
    try:
        summary = AnomalyEngine.run_full_scan(db)
        return summary
    except Exception as e:
        logger.error(f"Anomaly scan execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anomaly scan failed: {str(e)}"
        )

@router.get("", response_model=List[dict])
def list_anomalies(
    status_filter: Optional[str] = Query(None, alias="status"),
    record_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Lists detected anomalies with filtering and human review statuses.
    """
    query = db.query(AnomalyDetection)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(AnomalyDetection.status == status_filter.lower())
    if record_type and record_type.lower() != "all":
        query = query.filter(AnomalyDetection.record_type == record_type.lower())

    results = query.order_by(desc(AnomalyDetection.created_at)).offset(offset).limit(limit).all()

    items = []
    for a in results:
        items.append({
            "id": a.id,
            "record_id": a.record_id,
            "record_type": a.record_type,
            "detection_method": a.detection_method,
            "observed_value": a.observed_value,
            "reference_baseline": a.reference_baseline,
            "reason": a.reason,
            "raw_record": a.raw_record or {},
            "status": a.status,
            "reviewed_by": a.reviewed_by,
            "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return items

@router.get("/stats")
def get_anomaly_statistics(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated metrics and distributions for executive decision making.
    """
    total = db.query(AnomalyDetection).count()
    unreviewed = db.query(AnomalyDetection).filter(AnomalyDetection.status == "unreviewed").count()
    reviewed = db.query(AnomalyDetection).filter(AnomalyDetection.status == "reviewed").count()
    dismissed = db.query(AnomalyDetection).filter(AnomalyDetection.status == "dismissed").count()
    escalated = db.query(AnomalyDetection).filter(AnomalyDetection.status == "escalated").count()

    # Breakdown by detection method
    method_dist = db.query(
        AnomalyDetection.detection_method,
        func.count(AnomalyDetection.id).label("count")
    ).group_by(AnomalyDetection.detection_method).all()

    # Breakdown by record type
    type_dist = db.query(
        AnomalyDetection.record_type,
        func.count(AnomalyDetection.id).label("count")
    ).group_by(AnomalyDetection.record_type).all()

    return {
        "total_anomalies": total,
        "unreviewed": unreviewed,
        "reviewed": reviewed,
        "dismissed": dismissed,
        "escalated": escalated,
        "method_breakdown": [{"method": m[0], "count": m[1]} for m in method_dist],
        "type_breakdown": [{"type": t[0], "count": t[1]} for t in type_dist],
    }

@router.post("/{anomaly_id}/review")
def review_anomaly(
    anomaly_id: int,
    req: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Human-in-the-loop review action: mark an anomaly as reviewed, dismissed, or escalated.
    """
    try:
        updated = AnomalyEngine.review_anomaly(
            db=db,
            anomaly_id=anomaly_id,
            status=req.status,
            reviewer_email=current_user.email,
            notes=req.notes
        )
        return {
            "status": "success",
            "message": f"Anomaly {anomaly_id} marked as '{req.status}'.",
            "anomaly_id": updated.id,
            "new_status": updated.status,
            "reviewed_by": updated.reviewed_by,
            "reviewed_at": updated.reviewed_at.isoformat() if updated.reviewed_at else None
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to review anomaly {anomaly_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Review operation failed.")
