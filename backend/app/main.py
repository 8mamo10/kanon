from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import logging

from app.config import settings
from app.api.routes import health, pdf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Kanon PDF Analysis API",
    description="API for uploading and analyzing PDF files using Google Gemini AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory on startup
@app.on_event("startup")
async def startup_event():
    """Create necessary directories on application startup."""
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory created/verified at: {upload_path.absolute()}")
    logger.info(f"Gemini API configured with model: {settings.gemini_model}")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions globally."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred",
            "error": str(exc)
        }
    )


# Include routers
app.include_router(
    health.router,
    prefix=settings.api_v1_prefix,
    tags=["health"]
)

app.include_router(
    pdf.router,
    prefix=settings.api_v1_prefix,
    tags=["pdf"]
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Kanon PDF Analysis API",
        "version": "1.0.0",
        "docs": "/docs"
    }
