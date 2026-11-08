import logging
from typing import Optional, Literal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.all_models import User
from app.analytics.insights import BusinessInsightsEngine

logger = logging.getLogger("fuji_flow.api.insights")

router = APIRouter()

class AskAIRequest(BaseModel):
    question: str

@router.get("/executive-summary")
def get_executive_summary(
    time_range: Literal["today", "7d", "30d", "90d", "all", "custom"] = Query("all"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Returns AI-generated executive briefing and strategic recommendations
    grounded 100% in verified PostgreSQL metrics.
    """
    try:
        return BusinessInsightsEngine.generate_executive_insights(db, time_range=time_range)
    except Exception as e:
        logger.error(f"Failed to generate executive insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Insights generation failed: {str(e)}"
        )

@router.post("/ask")
def ask_grounded_assistant(
    req: AskAIRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Natural-language question answering grounded strictly in real database calculations.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")

    try:
        return BusinessInsightsEngine.answer_query(db, req.question)
    except Exception as e:
        logger.error(f"Failed to answer question '{req.question}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query resolution failed: {str(e)}"
        )
