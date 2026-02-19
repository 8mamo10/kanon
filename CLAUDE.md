# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kanon is a full-stack PDF analysis application consisting of:
- **Backend**: FastAPI (Python 3.11+) with PyMuPDF for PDF processing and Google Gemini API for AI analysis
- **Frontend**: Next.js 14 (TypeScript) with react-pdf for PDF viewing

The application works **with or without** a Gemini API key - when no key is configured, it returns mock analysis data to enable testing the PDF viewer functionality.

## Development Commands

### Backend (FastAPI)

```bash
# Setup
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run development server (with auto-reload)
uvicorn app.main:app --reload

# Run with debug logging
uvicorn app.main:app --reload --log-level debug

# Run on different port
uvicorn app.main:app --reload --port 8001
```

API documentation available at http://localhost:8000/docs (Swagger UI)

### Frontend (Next.js)

```bash
# Setup
cd frontend
pnpm install

# CRITICAL: Copy PDF.js worker after install
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Lint
pnpm lint
```

## Architecture

### Backend Request Flow

1. **Upload Request** → `POST /api/v1/pdf/analyze`
   - `app/api/routes/pdf.py::analyze_pdf()` validates file (type, size)
   - File saved with UUID to `./uploads/`
   - `app/services/pdf_processor.py::extract_text()` extracts text via PyMuPDF
   - `app/services/pdf_processor.py::extract_metadata()` gets page count, title, etc.
   - `app/services/gemini_service.py::analyze_comprehensive()` analyzes with Gemini (or returns mock data)
   - Returns `PDFAnalysisResponse` with file_id, analysis, and metadata

2. **Get PDF** → `GET /api/v1/pdf/{file_id}`
   - Serves PDF file from `./uploads/` directory

3. **Delete PDF** → `DELETE /api/v1/pdf/{file_id}`
   - Removes file from filesystem

### Frontend Component Architecture

**Main Page** (`app/page.tsx`)
- Single-page application managing upload/view/analyze flow
- State management: `loading`, `error`, `analysisData`, `pdfUrl`
- Creates blob URL from uploaded file for PDF viewing (avoids re-downloading)

**Key Components**:
- `PDFUpload.tsx`: react-dropzone integration with file validation
- `PDFViewer.tsx`: react-pdf wrapper with page navigation
- `AnalysisResults.tsx`: Displays analysis sections with copy-to-clipboard
- API client: `lib/api.ts` (axios-based with typed responses)

### Gemini Service Design

**Important**: `app/services/gemini_service.py` has dual-mode operation:

```python
class GeminiService:
    def __init__(self):
        self.enabled = False  # Tracks if API key is configured
        if not settings.gemini_api_key:
            # No API key → returns mock data
            return
        # Initialize Gemini client
```

- If `GEMINI_API_KEY` not set: `enabled=False`, returns mock analysis
- If API key set: `enabled=True`, calls Gemini 1.5 Pro
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Text truncation: First 50,000 characters only (to avoid token limits)

### PDF Processing

**PyMuPDF Integration** (`app/services/pdf_processor.py`):
- `extract_text()`: Returns page-delimited text (`--- Page N ---`)
- `extract_metadata()`: Returns dict with page_count, title, author, etc.
- `get_page_images()`: Extracts PNG images (NOT currently used but available for future OCR)

### Configuration

**Backend** (`app/config.py`):
- Uses Pydantic Settings for environment variables
- `gemini_api_key`: Optional[str] = None (app works without it)
- `allowed_origins`: Parsed into list for CORS

**Frontend**:
- `NEXT_PUBLIC_API_URL`: Backend URL (default: http://localhost:8000)

## Key Technical Decisions

### Synchronous Analysis
- PDF upload and analysis happen in single HTTP request (no job queue)
- Frontend timeout: 120 seconds (2 minutes) in `lib/api.ts`
- Suitable for documents up to ~50 pages

### No Database
- Files stored temporarily in filesystem with UUID naming
- No persistent storage of analysis results
- Client must re-upload for new analysis

### PDF Viewer Implementation
- Frontend creates blob URL from uploaded file (doesn't re-fetch from backend)
- PDF.js worker **must** be copied to `public/` directory after `pnpm install`
- Worker path configured in `PDFViewer.tsx`: `pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'`

### Mock Data Mode
- Enables testing PDF display without Gemini API key
- Health endpoint returns `"gemini_api": "not_configured"` when disabled
- Mock analysis includes clear messaging that Gemini is not configured

## API Endpoints

All endpoints prefixed with `/api/v1`:

- `GET /health` - Returns server status and Gemini connection status
- `POST /pdf/analyze` - Upload PDF (multipart/form-data), returns analysis
- `GET /pdf/{file_id}` - Download PDF file
- `DELETE /pdf/{file_id}` - Delete PDF file

## Common Development Workflows

### Adding a New Analysis Feature

1. Update prompt in `backend/app/services/gemini_service.py::_build_analysis_prompt()`
2. Update response parsing in `_parse_response()` to handle new fields
3. Update Pydantic schemas in `backend/app/models/schemas.py`
4. Update TypeScript types in `frontend/lib/types.ts`
5. Update UI in `frontend/components/AnalysisResults.tsx`

### Modifying PDF Processing

1. Edit `backend/app/services/pdf_processor.py`
2. PyMuPDF (fitz) is imported as `import fitz`
3. All methods are static on `PDFProcessor` class
4. Singleton instance exported: `pdf_processor = PDFProcessor()`

### Changing File Upload Limits

1. Backend: Set `MAX_FILE_SIZE_MB` in `.env` (default: 10)
2. Frontend: Update `MAX_FILE_SIZE` constant in `components/PDFUpload.tsx`

## Important Implementation Notes

### react-pdf Configuration
- **Critical**: Must configure webpack alias in `next.config.mjs`:
  ```javascript
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
  ```
- Worker file must exist at `public/pdf.worker.min.js`

### CORS Configuration
- Backend allows origins specified in `ALLOWED_ORIGINS` env var
- Default: `http://localhost:3000`
- Comma-separated for multiple origins

### Error Handling Pattern
- Backend: Custom exceptions (`PDFProcessorError`, `GeminiServiceError`)
- API routes convert to HTTPException with appropriate status codes
- Frontend: `APIError` class wraps axios errors with status codes

### File Cleanup
- Files persist until explicitly deleted via DELETE endpoint
- No automatic cleanup (consider adding cron job for production)
- Uploaded files stored in `backend/uploads/` (gitignored)

## Environment Variables

### Backend (.env)
```bash
GEMINI_API_KEY=          # Optional - uses mock data if not set
GEMINI_MODEL=gemini-1.5-pro
ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testing Modes

**Without Gemini** (for UI testing):
- No `.env` file needed in backend
- Backend logs: "WARNING: Gemini API key not configured - analysis will return mock data"
- Health endpoint: `"gemini_api": "not_configured"`

**With Gemini** (for full testing):
- Create `backend/.env` with `GEMINI_API_KEY`
- Backend logs: "INFO: Gemini service initialized with model: gemini-1.5-pro"
- Health endpoint: `"gemini_api": "connected"`
