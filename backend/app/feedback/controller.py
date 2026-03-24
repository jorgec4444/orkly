import logging

from fastapi import APIRouter, Request
from datetime import datetime
from app.utils.http import get_client_ip
from .schemas import FeedbackRequest
from .service import feedback_logger

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/feedback", tags=["feedback"])
async def receive_feedback(body: FeedbackRequest, req: Request):
    """Store user feedback."""
    logger.info(f"Received feedback from IP {get_client_ip(req)}")
    feedback_logger.log_feedback(
        ip=get_client_ip(req),
        feedback=body.feedback,
        timestamp=datetime.now().isoformat(),
    )
    return {"success": True, "message": "Feedback received — thank you!"}