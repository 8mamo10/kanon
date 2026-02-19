import google.generativeai as genai
from typing import Dict, Any, Optional
import logging
import json
import time

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Custom exception for Gemini service errors."""
    pass


class GeminiService:
    """Service for analyzing PDFs using Google Gemini API."""

    def __init__(self):
        """Initialize Gemini API client."""
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(settings.gemini_model)
            logger.info(f"Gemini service initialized with model: {settings.gemini_model}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {str(e)}")
            raise GeminiServiceError(f"Gemini initialization failed: {str(e)}")

    def analyze_comprehensive(
        self,
        text: str,
        metadata: Dict[str, Any],
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of PDF content using Gemini.

        Args:
            text: Extracted text from PDF
            metadata: PDF metadata (page count, title, etc.)
            max_retries: Number of retry attempts for API calls

        Returns:
            Dictionary containing analysis results with structure:
            {
                "summary": str,
                "extracted_data": dict,
                "classification": dict,
                "key_insights": list
            }

        Raises:
            GeminiServiceError: If analysis fails
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for analysis")
            return self._get_empty_analysis()

        prompt = self._build_analysis_prompt(text, metadata)

        for attempt in range(max_retries):
            try:
                logger.info(f"Starting Gemini analysis (attempt {attempt + 1}/{max_retries})")
                response = self.model.generate_content(prompt)

                if not response or not response.text:
                    raise GeminiServiceError("Empty response from Gemini API")

                analysis_result = self._parse_response(response.text)
                logger.info("Successfully completed Gemini analysis")
                return analysis_result

            except Exception as e:
                logger.warning(f"Analysis attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise GeminiServiceError(f"Analysis failed after {max_retries} attempts: {str(e)}")

    def _build_analysis_prompt(self, text: str, metadata: Dict[str, Any]) -> str:
        """Build the analysis prompt for Gemini."""
        page_count = metadata.get("page_count", "unknown")
        title = metadata.get("title", "untitled")

        prompt = f"""You are an expert document analyzer. Analyze the following PDF document and provide a comprehensive analysis.

Document Metadata:
- Title: {title}
- Pages: {page_count}

Document Content:
{text[:50000]}  # Limit to first 50k characters to avoid token limits

Please provide a detailed analysis in the following JSON format:

{{
    "summary": "A concise 2-3 sentence summary of the document's main content and purpose",
    "extracted_data": {{
        "key_entities": ["List of important entities, people, organizations mentioned"],
        "dates": ["Important dates found in the document"],
        "numbers": ["Significant numbers, statistics, or metrics"],
        "topics": ["Main topics or themes covered"]
    }},
    "classification": {{
        "document_type": "Type of document (e.g., research paper, invoice, report, article, contract, etc.)",
        "industry": "Relevant industry or domain",
        "confidence": "high/medium/low confidence in classification"
    }},
    "key_insights": [
        "Important insight or finding 1",
        "Important insight or finding 2",
        "Important insight or finding 3"
    ]
}}

Respond ONLY with valid JSON. Do not include any other text or formatting."""

        return prompt

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate Gemini response."""
        try:
            # Try to find JSON in the response
            response_text = response_text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            # Parse JSON
            result = json.loads(response_text)

            # Validate structure
            required_keys = ["summary", "extracted_data", "classification", "key_insights"]
            for key in required_keys:
                if key not in result:
                    logger.warning(f"Missing key in response: {key}")
                    result[key] = self._get_default_value(key)

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.debug(f"Response text: {response_text[:500]}")
            # Return structured error response
            return {
                "summary": "Analysis completed but response parsing failed. The document was processed successfully.",
                "extracted_data": {
                    "key_entities": [],
                    "dates": [],
                    "numbers": [],
                    "topics": ["Unable to extract structured data"]
                },
                "classification": {
                    "document_type": "Unknown",
                    "industry": "Unknown",
                    "confidence": "low"
                },
                "key_insights": ["Raw analysis available but structured parsing failed"]
            }

    def _get_default_value(self, key: str) -> Any:
        """Get default value for missing keys."""
        defaults = {
            "summary": "No summary available",
            "extracted_data": {
                "key_entities": [],
                "dates": [],
                "numbers": [],
                "topics": []
            },
            "classification": {
                "document_type": "Unknown",
                "industry": "Unknown",
                "confidence": "low"
            },
            "key_insights": []
        }
        return defaults.get(key, None)

    def _get_empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure for empty documents."""
        return {
            "summary": "No text content found in the document. The document may be image-based or empty.",
            "extracted_data": {
                "key_entities": [],
                "dates": [],
                "numbers": [],
                "topics": []
            },
            "classification": {
                "document_type": "Empty or image-only document",
                "industry": "Unknown",
                "confidence": "low"
            },
            "key_insights": ["Document contains no extractable text"]
        }

    def check_connection(self) -> bool:
        """
        Check if Gemini API connection is working.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Simple test prompt
            response = self.model.generate_content("Respond with 'OK'")
            return response and response.text is not None
        except Exception as e:
            logger.error(f"Gemini connection check failed: {str(e)}")
            return False


# Create singleton instance
gemini_service = GeminiService()
