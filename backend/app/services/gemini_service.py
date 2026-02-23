import google.generativeai as genai
from typing import Dict, Any, Optional, List
import logging
import json
import time
from PIL import Image
import io

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
        images: Optional[List[bytes]] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of PDF content using Gemini.

        Args:
            text: Extracted text from PDF
            metadata: PDF metadata (page count, title, etc.)
            images: Optional list of PDF page images (PNG bytes) for visual analysis
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

                # Prepare content for Gemini (text + images for multimodal analysis)
                content_parts = [prompt]

                if images and len(images) > 0:
                    logger.info(f"Including {len(images)} page images for visual analysis")
                    for i, img_bytes in enumerate(images):
                        try:
                            # Convert bytes to PIL Image
                            img = Image.open(io.BytesIO(img_bytes))
                            content_parts.append(img)
                            logger.info(f"  Image {i+1}: {img.size[0]}x{img.size[1]} pixels")
                        except Exception as e:
                            logger.warning(f"Failed to process image {i}: {str(e)}")
                else:
                    logger.info("No images provided - using text-only analysis")

                # Send to Gemini (multimodal if images provided)
                response = self.model.generate_content(content_parts)

                if not response or not response.text:
                    raise GeminiServiceError("Empty response from Gemini API")

                # Log the raw response for debugging
                logger.info("=" * 80)
                logger.info("RAW GEMINI API RESPONSE:")
                logger.info(response.text)
                logger.info("=" * 80)

                analysis_result = self._parse_response(response.text)

                # Log parsed analysis result with coordinates
                logger.info("=" * 80)
                logger.info("PARSED ANALYSIS RESULT:")
                logger.info(json.dumps(analysis_result, indent=2, ensure_ascii=False))
                logger.info("=" * 80)

                # Log coordinate details for overlay debugging
                self._log_coordinate_details(analysis_result)

                # Save to file for mock data generation
                self._save_analysis_to_file(analysis_result)

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

Help me find and extract all values in this drawing, and classify extracted values as: dimension, annotation, title block, others. Extract and list all values, even if they seem to duplicate for easier verification.

For each value, include its coordinate on the image using NORMALIZED COORDINATES where:
- (0,0) is the TOP-LEFT corner
- (1,1) is the BOTTOM-RIGHT corner
- All coordinate values must be in the 0-1 range
- upper_y is the TOP edge (smaller Y value)
- lower_y is the BOTTOM edge (larger Y value)

Please don't include results from previous query: only focus on current uploaded drawing.

Return the result in this JSON format:

{{
    "summary": "A concise 2-3 sentence summary of the document's main content and purpose",
    "classification": {{
        "document_type": "Type of document (e.g., technical drawing, engineering drawing, architectural plan, research paper, invoice, report, etc.)",
        "industry": "Relevant industry or domain",
        "confidence": "high/medium/low confidence in classification"
    }},
    "dimension": [
        {{
            "value": "extracted value from drawing",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x (0-1 range)",
                    "right_x": "right coordinate x (0-1 range)"
                }},
                "y": {{
                    "lower_y": "lower coordinate y (0-1 range, bottom edge)",
                    "upper_y": "upper coordinate y (0-1 range, top edge)"
                }}
            }}
        }}
    ],
    "annotation": [
        {{
            "value": "extracted annotation text in original language",
            "value_en": "English translation of the annotation text",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x (0-1 range)",
                    "right_x": "right coordinate x (0-1 range)"
                }},
                "y": {{
                    "lower_y": "lower coordinate y (0-1 range, bottom edge)",
                    "upper_y": "upper coordinate y (0-1 range, top edge)"
                }}
            }}
        }}
    ],
    "title_block": [
        {{
            "value": "title block information in original language",
            "value_en": "English translation of the title block text",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x (0-1 range)",
                    "right_x": "right coordinate x (0-1 range)"
                }},
                "y": {{
                    "lower_y": "lower coordinate y (0-1 range, bottom edge)",
                    "upper_y": "upper coordinate y (0-1 range, top edge)"
                }}
            }}
        }}
    ],
    "others": [
        {{
            "value": "other extracted information",
            "coordinate": {{
                "x": {{
                    "left_x": "left coordinate x (0-1 range)",
                    "right_x": "right coordinate x (0-1 range)"
                }},
                "y": {{
                    "lower_y": "lower coordinate y (0-1 range, bottom edge)",
                    "upper_y": "upper coordinate y (0-1 range, top edge)"
                }}
            }}
        }}
    ],
    "key_insights": [
        "Important insight or finding about the document"
    ]
}}

CRITICAL COORDINATE REQUIREMENTS:
- All coordinates MUST be normalized values between 0 and 1
- (0,0) = top-left corner, (1,1) = bottom-right corner
- For Y coordinates: upper_y < lower_y (because upper is top, lower is bottom)
- Example: An element at the top-left might have upper_y=0.1, lower_y=0.15
- Extract ALL values including duplicates for verification
- Focus ONLY on the current drawing, not previous queries

CONTENT EXTRACTION INSTRUCTIONS:
- For technical drawings: Extract dimensions, annotations, title blocks with their precise coordinates
- For non-technical documents: Set dimension, annotation, title_block as empty arrays []
- Always include the summary, classification, and key_insights fields
- For annotation and title_block: Provide English translation in "value_en" field
- For dimension entries: Do NOT include "value_en" field (dimensions don't need translation)

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

    def _save_analysis_to_file(self, analysis_result: Dict[str, Any]) -> None:
        """Save analysis result to files for archiving and mock data.

        Saves to two locations:
        1. Timestamped file in gemini_outputs/ for archiving
        2. mock_data.json for use as mock data when Gemini API is not configured
        """
        try:
            import os
            from datetime import datetime

            # Create output directory if it doesn't exist
            output_dir = "./gemini_outputs"
            os.makedirs(output_dir, exist_ok=True)

            # Save timestamped archive file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            archive_file = f"{output_dir}/gemini_analysis_{timestamp}.json"
            with open(archive_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_result, f, indent=2, ensure_ascii=False)
            logger.info(f"Analysis archived to: {archive_file}")

            # Save to mock_data.json (overwriting previous)
            mock_data_file = "./mock_data.json"
            with open(mock_data_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_result, f, indent=2, ensure_ascii=False)
            logger.info(f"Mock data updated: {mock_data_file}")
            logger.info("This file will be used for mock analysis when Gemini API is not configured")

        except Exception as e:
            logger.warning(f"Failed to save analysis to file: {str(e)}")

    def _log_coordinate_details(self, analysis_result: Dict[str, Any]) -> None:
        """Log detailed coordinate information for debugging overlays."""
        logger.info("=" * 80)
        logger.info("COORDINATE DETAILS FOR OVERLAY DEBUGGING:")
        logger.info("Normalized coordinates: (0,0) = top-left, (1,1) = bottom-right")
        logger.info("=" * 80)

        # Log annotations
        annotations = analysis_result.get("annotation", [])
        if annotations:
            logger.info(f"\nANNOTATIONS ({len(annotations)} items):")
            for i, item in enumerate(annotations):
                logger.info(f"\n  [{i}] Value: {item.get('value', 'N/A')}")
                logger.info(f"      Translation: {item.get('value_en', 'N/A')}")
                coord = item.get("coordinate", {})
                logger.info(f"      Coordinates:")
                logger.info(f"        X: left={coord.get('x', {}).get('left_x', 'N/A')}, right={coord.get('x', {}).get('right_x', 'N/A')}")
                logger.info(f"        Y: lower={coord.get('y', {}).get('lower_y', 'N/A')}, upper={coord.get('y', {}).get('upper_y', 'N/A')}")
        else:
            logger.info("\nANNOTATIONS: None")

        # Log title blocks
        title_blocks = analysis_result.get("title_block", [])
        if title_blocks:
            logger.info(f"\nTITLE BLOCKS ({len(title_blocks)} items):")
            for i, item in enumerate(title_blocks):
                logger.info(f"\n  [{i}] Value: {item.get('value', 'N/A')}")
                logger.info(f"      Translation: {item.get('value_en', 'N/A')}")
                coord = item.get("coordinate", {})
                logger.info(f"      Coordinates:")
                logger.info(f"        X: left={coord.get('x', {}).get('left_x', 'N/A')}, right={coord.get('x', {}).get('right_x', 'N/A')}")
                logger.info(f"        Y: lower={coord.get('y', {}).get('lower_y', 'N/A')}, upper={coord.get('y', {}).get('upper_y', 'N/A')}")
        else:
            logger.info("\nTITLE BLOCKS: None")

        # Log dimensions (no translation)
        dimensions = analysis_result.get("dimension", [])
        if dimensions:
            logger.info(f"\nDIMENSIONS ({len(dimensions)} items):")
            for i, item in enumerate(dimensions):
                logger.info(f"\n  [{i}] Value: {item.get('value', 'N/A')}")
                coord = item.get("coordinate", {})
                logger.info(f"      Coordinates:")
                logger.info(f"        X: left={coord.get('x', {}).get('left_x', 'N/A')}, right={coord.get('x', {}).get('right_x', 'N/A')}")
                logger.info(f"        Y: lower={coord.get('y', {}).get('lower_y', 'N/A')}, upper={coord.get('y', {}).get('upper_y', 'N/A')}")
        else:
            logger.info("\nDIMENSIONS: None")

        logger.info("\n" + "=" * 80)

    def _load_mock_data_from_file(self) -> Optional[Dict[str, Any]]:
        """Load mock data from mock_data.json file.

        Returns:
            Dictionary containing mock analysis data, or None if file not found/invalid
        """
        try:
            import os
            mock_data_file = "./mock_data.json"

            if not os.path.exists(mock_data_file):
                logger.warning(f"Mock data file not found: {mock_data_file}")
                return None

            with open(mock_data_file, 'r', encoding='utf-8') as f:
                mock_data = json.load(f)

            logger.info(f"Loaded mock data from: {mock_data_file}")
            return mock_data

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in mock data file: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Failed to load mock data file: {str(e)}")
            return None

    def _get_mock_analysis(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Return mock analysis data when Gemini is not enabled.

        Loads mock data from mock_data.json file. This file can be updated
        by running a real Gemini analysis (which auto-saves to this file)
        or by manually editing the file.
        """
        # Try to load mock data from file
        mock_result = self._load_mock_data_from_file()

        # Fall back to minimal default if file not found
        if not mock_result:
            page_count = metadata.get("page_count", 0)
            title = metadata.get("title", "PDF Document")

            logger.warning("Using fallback mock data (mock_data.json not found)")
            mock_result = {
                "summary": f"This is a {page_count}-page PDF document titled '{title}'. Gemini API analysis is not configured. Please create backend/mock_data.json file or configure GEMINI_API_KEY in .env.",
                "classification": {
                    "document_type": "PDF Document (No Mock Data)",
                    "industry": "General",
                    "confidence": "low"
                },
                "dimension": [],
                "annotation": [],
                "title_block": [],
                "others": [],
                "key_insights": [
                    "Gemini API key is not configured",
                    "mock_data.json file not found",
                    "Please upload a PDF with Gemini API enabled to generate mock_data.json",
                    "Or manually create backend/mock_data.json with analysis data"
                ]
            }

        # Log mock data source
        logger.info("=" * 80)
        logger.info("RETURNING MOCK ANALYSIS DATA:")
        logger.info(f"Data loaded from: {'mock_data.json' if self._load_mock_data_from_file() else 'fallback (no file)'}")
        logger.info("=" * 80)
        self._log_coordinate_details(mock_result)

        return mock_result

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
