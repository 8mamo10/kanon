from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
import logging
import aiofiles
import os

from app.config import settings
from app.models.schemas import PDFAnalysisResponse, DeleteResponse, ErrorResponse, PDFMetadata
from app.services.pdf_processor import pdf_processor, PDFProcessorError
from app.services.gemini_service import gemini_service, GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/pdf/analyze",
    response_model=PDFAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload and Analyze PDF",
    description="Upload a PDF file and get comprehensive AI analysis"
)
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Upload and analyze a PDF file.

    Args:
        file: PDF file to analyze

    Returns:
        PDFAnalysisResponse with analysis results

    Raises:
        HTTPException: If validation fails or processing errors occur
    """
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Expected application/pdf, got {file.content_type}"
        )

    # Validate filename
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename. File must have .pdf extension"
        )

    # Generate unique file ID
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    saved_filename = f"{file_id}{file_extension}"
    file_path = Path(settings.upload_dir) / saved_filename

    try:
        # Read and save file
        content = await file.read()

        # Validate file size
        file_size = len(content)
        if file_size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB"
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        logger.info(f"Saved PDF file: {file_path} ({file_size} bytes)")

        # Validate PDF
        if not pdf_processor.validate_pdf(str(file_path)):
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or corrupted PDF file"
            )

        # Extract text and metadata
        try:
            text = pdf_processor.extract_text(str(file_path))
            metadata_dict = pdf_processor.extract_metadata(str(file_path))
            metadata = PDFMetadata(**metadata_dict)
        except PDFProcessorError as e:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PDF processing error: {str(e)}"
            )

        # Extract page images for visual analysis
        try:
            images = pdf_processor.get_page_images(str(file_path), max_pages=5)
            logger.info(f"Extracted {len(images)} page images for visual analysis")
        except PDFProcessorError as e:
            logger.warning(f"Failed to extract page images: {str(e)}")
            images = None

        # Analyze with Gemini (pass images for visual coordinate extraction)
        try:
            analysis = gemini_service.analyze_comprehensive(text, metadata_dict, images)
        except GeminiServiceError as e:
            logger.error(f"Gemini analysis failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI analysis error: {str(e)}"
            )

        # Return response
        return PDFAnalysisResponse(
            file_id=file_id,
            filename=file.filename,
            analysis=analysis,
            metadata=metadata
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            os.remove(file_path)
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing PDF: {str(e)}"
        )


@router.get(
    "/pdf/{file_id}",
    response_class=FileResponse,
    summary="Get PDF File",
    description="Retrieve a specific PDF file by ID"
)
async def get_pdf(file_id: str):
    """
    Retrieve a PDF file by ID.

    Args:
        file_id: UUID of the PDF file

    Returns:
        PDF file

    Raises:
        HTTPException: If file not found
    """
    # Find file with this ID
    upload_dir = Path(settings.upload_dir)
    pdf_files = list(upload_dir.glob(f"{file_id}.pdf"))

    if not pdf_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF file not found: {file_id}"
        )

    file_path = pdf_files[0]

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"{file_id}.pdf"
    )


@router.delete(
    "/pdf/{file_id}",
    response_model=DeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete PDF File",
    description="Delete a specific PDF file by ID"
)
async def delete_pdf(file_id: str):
    """
    Delete a PDF file by ID.

    Args:
        file_id: UUID of the PDF file

    Returns:
        DeleteResponse with confirmation

    Raises:
        HTTPException: If file not found
    """
    # Find file with this ID
    upload_dir = Path(settings.upload_dir)
    pdf_files = list(upload_dir.glob(f"{file_id}.pdf"))

    if not pdf_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF file not found: {file_id}"
        )

    file_path = pdf_files[0]

    try:
        os.remove(file_path)
        logger.info(f"Deleted PDF file: {file_path}")

        return DeleteResponse(
            message="File deleted successfully",
            file_id=file_id
        )
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}"
        )
