from fastapi import APIRouter, status
import logging

from app.models.schemas import HealthResponse
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Check the health status of the API and Gemini connection"
)
async def health_check():
    """
    Health check endpoint.

    Returns:
        HealthResponse with status of API and Gemini connection
    """
    try:
        gemini_status = "connected" if gemini_service.check_connection() else "disconnected"
    except Exception as e:
        logger.error(f"Error checking Gemini connection: {str(e)}")
        gemini_status = "error"

    return HealthResponse(
        status="healthy",
        gemini_api=gemini_status
    )
