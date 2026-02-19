import fitz  # PyMuPDF
from typing import Dict, List, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class PDFProcessorError(Exception):
    """Custom exception for PDF processing errors."""
    pass


class PDFProcessor:
    """Service for processing PDF files using PyMuPDF."""

    @staticmethod
    def extract_text(pdf_path: str) -> str:
        """
        Extract all text content from a PDF file.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            Extracted text as a single string

        Raises:
            PDFProcessorError: If PDF cannot be processed
        """
        try:
            if not Path(pdf_path).exists():
                raise PDFProcessorError(f"PDF file not found: {pdf_path}")

            doc = fitz.open(pdf_path)
            text_content = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    text_content.append(f"--- Page {page_num + 1} ---\n{text}")

            doc.close()

            full_text = "\n\n".join(text_content)

            if not full_text.strip():
                logger.warning(f"No text extracted from PDF: {pdf_path}")
                return ""

            logger.info(f"Extracted {len(full_text)} characters from {len(text_content)} pages")
            return full_text

        except fitz.FileDataError as e:
            raise PDFProcessorError(f"Corrupted or invalid PDF file: {str(e)}")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise PDFProcessorError(f"Failed to extract text: {str(e)}")

    @staticmethod
    def extract_metadata(pdf_path: str) -> Dict[str, any]:
        """
        Extract metadata from a PDF file.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            Dictionary containing metadata (page_count, author, title, etc.)

        Raises:
            PDFProcessorError: If PDF cannot be processed
        """
        try:
            if not Path(pdf_path).exists():
                raise PDFProcessorError(f"PDF file not found: {pdf_path}")

            doc = fitz.open(pdf_path)
            metadata = doc.metadata
            page_count = len(doc)

            result = {
                "page_count": page_count,
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", ""),
            }

            doc.close()

            logger.info(f"Extracted metadata from PDF: {page_count} pages")
            return result

        except fitz.FileDataError as e:
            raise PDFProcessorError(f"Corrupted or invalid PDF file: {str(e)}")
        except Exception as e:
            logger.error(f"Error extracting metadata from PDF: {str(e)}")
            raise PDFProcessorError(f"Failed to extract metadata: {str(e)}")

    @staticmethod
    def get_page_images(pdf_path: str, max_pages: int = 5) -> List[bytes]:
        """
        Extract images from PDF pages for visual analysis.

        Args:
            pdf_path: Path to the PDF file
            max_pages: Maximum number of pages to extract images from

        Returns:
            List of image bytes (PNG format)

        Raises:
            PDFProcessorError: If PDF cannot be processed
        """
        try:
            if not Path(pdf_path).exists():
                raise PDFProcessorError(f"PDF file not found: {pdf_path}")

            doc = fitz.open(pdf_path)
            images = []

            pages_to_process = min(len(doc), max_pages)

            for page_num in range(pages_to_process):
                page = doc[page_num]
                # Render page as image (PNG)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
                img_bytes = pix.tobytes("png")
                images.append(img_bytes)

            doc.close()

            logger.info(f"Extracted {len(images)} page images from PDF")
            return images

        except fitz.FileDataError as e:
            raise PDFProcessorError(f"Corrupted or invalid PDF file: {str(e)}")
        except Exception as e:
            logger.error(f"Error extracting images from PDF: {str(e)}")
            raise PDFProcessorError(f"Failed to extract images: {str(e)}")

    @staticmethod
    def validate_pdf(pdf_path: str) -> bool:
        """
        Validate if a file is a valid PDF.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            True if valid PDF, False otherwise
        """
        try:
            doc = fitz.open(pdf_path)
            doc.close()
            return True
        except Exception as e:
            logger.warning(f"PDF validation failed: {str(e)}")
            return False


# Create singleton instance
pdf_processor = PDFProcessor()
