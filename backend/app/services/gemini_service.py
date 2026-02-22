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
        self.enabled = False
        self.model = None

        if not settings.gemini_api_key:
            logger.warning("Gemini API key not configured - analysis will return mock data")
            return

        try:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(settings.gemini_model)
            self.enabled = True
            logger.info(f"Gemini service initialized with model: {settings.gemini_model}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {str(e)}")
            logger.warning("Gemini service will return mock data")

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
        # Return mock data if Gemini is not enabled
        if not self.enabled:
            logger.info("Gemini not enabled - returning mock analysis data")
            return self._get_mock_analysis(metadata)

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

        prompt = f"""You are an expert technical drawing and document analyzer. Analyze the following PDF document and extract structured information.

Document Metadata:
- Title: {title}
- Pages: {page_count}

Document Content:
{text[:50000]}

Please provide a detailed analysis in the following JSON format:

{{
    "summary": "A concise 2-3 sentence summary of the document's main content and purpose",
    "classification": {{
        "document_type": "Type of document (e.g., technical drawing, engineering drawing, architectural plan, research paper, invoice, report, etc.)",
        "industry": "Relevant industry or domain",
        "confidence": "high/medium/low confidence in classification"
    }},
    "dimension": [
        {{
            "value": "extracted dimension value from drawing (e.g., '100mm', '5.5\"', '3.2m')",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x of element",
                    "right_x": "right coordinate x"
                }},
                "y": {{
                    "lower_y": "lower coordinate y of element",
                    "upper_y": "upper coordinate y"
                }}
            }}
        }}
    ],
    "annotation": [
        {{
            "value": "extracted annotation text in original language (e.g., notes, labels, callouts)",
            "value_en": "English translation of the annotation text",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x",
                    "right_x": "right coordinate x"
                }},
                "y": {{
                    "lower_y": "lower coordinate y",
                    "upper_y": "upper coordinate y"
                }}
            }}
        }}
    ],
    "title_block": [
        {{
            "value": "title block information in original language (e.g., drawing number, revision, date, author)",
            "value_en": "English translation of the title block text",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x",
                    "right_x": "right coordinate x"
                }},
                "y": {{
                    "lower_y": "lower coordinate y",
                    "upper_y": "upper coordinate y"
                }}
            }}
        }}
    ],
    "others": [
        {{
            "value": "other extracted information (e.g., general notes, legends, symbols)",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x",
                    "right_x": "right coordinate x"
                }},
                "y": {{
                    "lower_y": "lower coordinate y",
                    "upper_y": "upper coordinate y"
                }}
            }}
        }}
    ],
    "key_insights": [
        "Important insight or finding about the document"
    ]
}}

IMPORTANT INSTRUCTIONS:
- For technical drawings: Extract dimensions, annotations, title blocks with their coordinates
- For non-technical documents: Set dimension, annotation, title_block, and others as empty arrays []
- Coordinate values should be numeric strings or "unknown" if not determinable from text alone
- If this is NOT a technical drawing, focus on extracting key information in the "others" section
- Always include the summary, classification, and key_insights fields
- For annotation and title_block entries: If the original text is in Japanese, provide English translation in "value_en" field
- For annotation and title_block entries: If the original text is already in English, set "value_en" to the same value
- For dimension entries: Do NOT include "value_en" field (dimensions are numeric and don't need translation)

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
            required_keys = ["summary", "classification", "dimension", "annotation", "title_block", "others", "key_insights"]
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
                "classification": {
                    "document_type": "Unknown",
                    "industry": "Unknown",
                    "confidence": "low"
                },
                "dimension": [],
                "annotation": [],
                "title_block": [],
                "others": [],
                "key_insights": ["Raw analysis available but structured parsing failed"]
            }

    def _get_default_value(self, key: str) -> Any:
        """Get default value for missing keys."""
        defaults = {
            "summary": "No summary available",
            "classification": {
                "document_type": "Unknown",
                "industry": "Unknown",
                "confidence": "low"
            },
            "dimension": [],
            "annotation": [],
            "title_block": [],
            "others": [],
            "key_insights": []
        }
        return defaults.get(key, None)

    def _get_empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure for empty documents."""
        return {
            "summary": "No text content found in the document. The document may be image-based or empty.",
            "classification": {
                "document_type": "Empty or image-only document",
                "industry": "Unknown",
                "confidence": "low"
            },
            "dimension": [],
            "annotation": [],
            "title_block": [],
            "others": [],
            "key_insights": ["Document contains no extractable text"]
        }

    def _get_mock_analysis(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Return mock analysis data when Gemini is not enabled."""
        page_count = metadata.get("page_count", 0)
        title = metadata.get("title", "PDF Document")

        return {
            "summary": f"This is a {page_count}-page PDF document titled '{title}'. Gemini API analysis is not configured - this is mock data for testing the PDF viewer.",
            "classification": {
                "document_type": "PDF Document (Mock Analysis)",
                "industry": "General",
                "confidence": "low"
            },
            "dimension": [
                {
                    "value": "100mm",
                    "coordinate": {
                        "x": {"left_x": "50", "right_x": "150"},
                        "y": {"lower_y": "200", "upper_y": "220"}
                    }
                },
                {
                    "value": "5.5\"",
                    "coordinate": {
                        "x": {"left_x": "300", "right_x": "400"},
                        "y": {"lower_y": "150", "upper_y": "170"}
                    }
                }
            ],
            "annotation": [
                {
                    "value": "サンプル注釈テキスト",
                    "value_en": "Sample annotation text",
                    "coordinate": {
                        "x": {"left_x": "100", "right_x": "200"},
                        "y": {"lower_y": "300", "upper_y": "320"}
                    }
                }
            ],
            "title_block": [
                {
                    "value": "図面番号: MOCK-001",
                    "value_en": "Drawing Number: MOCK-001",
                    "coordinate": {
                        "x": {"left_x": "500", "right_x": "700"},
                        "y": {"lower_y": "50", "upper_y": "100"}
                    }
                },
                {
                    "value": "改訂: A",
                    "value_en": "Revision: A",
                    "coordinate": {
                        "x": {"left_x": "500", "right_x": "700"},
                        "y": {"lower_y": "100", "upper_y": "120"}
                    }
                }
            ],
            "others": [
                {
                    "value": "This is mock data - Gemini API not configured",
                    "coordinate": {
                        "x": {"left_x": "0", "right_x": "100"},
                        "y": {"lower_y": "0", "upper_y": "20"}
                    }
                }
            ],
            "key_insights": [
                "Gemini API key is not configured",
                "This is mock data for testing PDF display",
                "Configure GEMINI_API_KEY in .env to enable real analysis"
            ]
        }

    def check_connection(self) -> bool:
        """
        Check if Gemini API connection is working.

        Returns:
            True if connection successful, False otherwise
        """
        if not self.enabled or not self.model:
            return False

        try:
            # Simple test prompt
            response = self.model.generate_content("Respond with 'OK'")
            return response and response.text is not None
        except Exception as e:
            logger.error(f"Gemini connection check failed: {str(e)}")
            return False


# Create singleton instance
gemini_service = GeminiService()
