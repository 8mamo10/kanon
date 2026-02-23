# Mock Data Management

## Overview

The Kanon backend can operate in two modes:
1. **With Gemini API** - Real PDF analysis using Google Gemini
2. **Without Gemini API** - Mock data mode for testing/development

## Mock Data File

Mock data is loaded from: `backend/mock_data.json`

This file contains realistic analysis data from an actual technical drawing (Sensor Plate) and is used when:
- `GEMINI_API_KEY` is not set in `.env`
- Gemini API is unavailable

## Updating Mock Data

### Option 1: Automatic (Using Gemini API)

1. Configure your Gemini API key in `.env`:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

2. Upload and analyze a PDF through the application

3. The analysis result is automatically saved to:
   - `backend/mock_data.json` (overwrites previous mock data)
   - `backend/gemini_outputs/gemini_analysis_YYYYMMDD_HHMMSS.json` (archived copy)

4. Remove the API key from `.env` to test with the new mock data

### Option 2: Manual

Edit `backend/mock_data.json` directly with your own analysis data.

The file must have this structure:

```json
{
  "summary": "Document summary text...",
  "classification": {
    "document_type": "technical drawing",
    "industry": "manufacturing",
    "confidence": "high"
  },
  "dimension": [
    {
      "value": "100",
      "coordinate": {
        "x": {"left_x": "0.244", "right_x": "0.27"},
        "y": {"lower_y": "0.418", "upper_y": "0.38"}
      }
    }
  ],
  "annotation": [
    {
      "value": "2-M5",
      "value_en": "2-M5 (threaded holes)",
      "coordinate": {
        "x": {"left_x": "0.301", "right_x": "0.347"},
        "y": {"lower_y": "0.334", "upper_y": "0.31"}
      }
    }
  ],
  "title_block": [...],
  "others": [...],
  "key_insights": [...]
}
```

## Files and Directories

```
backend/
├── mock_data.json              # Current mock data (committed to repo)
├── gemini_outputs/             # Archived Gemini responses (gitignored)
│   └── gemini_analysis_*.json  # Timestamped analysis results
└── README_MOCK_DATA.md         # This file
```

## Fallback Behavior

If `mock_data.json` is missing or invalid, the system returns minimal fallback data with a message to create the file.

## Best Practices

1. **Keep mock_data.json realistic** - Use actual Gemini outputs
2. **Test with mock data** - Verify UI works without API key
3. **Archive interesting analyses** - Files in `gemini_outputs/` are preserved
4. **Version control** - Commit `mock_data.json` so others can test without API access

## Switching Mock Data

To switch between different mock data sets:

```bash
# Save current mock data
cp mock_data.json mock_data_sensor_plate.json

# Use a different analysis
cp gemini_outputs/gemini_analysis_20260223_143045.json mock_data.json

# Or restore previous
cp mock_data_sensor_plate.json mock_data.json
```
