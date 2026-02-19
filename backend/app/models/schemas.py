from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime


class PDFMetadata(BaseModel):
    """PDF document metadata."""
    page_count: int
    title: str = ""
    author: str = ""
    subject: str = ""
    creator: str = ""
    producer: str = ""
    creation_date: str = ""
    modification_date: str = ""


class ExtractedData(BaseModel):
    """Structured data extracted from PDF."""
    key_entities: List[str] = Field(default_factory=list)
    dates: List[str] = Field(default_factory=list)
    numbers: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)


class Classification(BaseModel):
    """Document classification information."""
    document_type: str
    industry: str
    confidence: str


class AnalysisResult(BaseModel):
    """Complete analysis result from Gemini."""
    summary: str
    extracted_data: ExtractedData
    classification: Classification
    key_insights: List[str] = Field(default_factory=list)


class PDFAnalysisResponse(BaseModel):
    """Response model for PDF analysis endpoint."""
    file_id: str
    filename: str
    analysis: Dict[str, Any]
    metadata: PDFMetadata
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    gemini_api: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class DeleteResponse(BaseModel):
    """Response model for delete endpoint."""
    message: str
    file_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
