# Kanon Backend

FastAPI backend for PDF analysis using Google Gemini API.

## Setup

### Prerequisites

- Python 3.11 or higher
- Google Gemini API key (optional - app works without it for testing PDF display)

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

## Running the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### Health Check
- `GET /api/v1/health` - Check server and Gemini API status

### PDF Operations
- `POST /api/v1/pdf/analyze` - Upload and analyze a PDF file
- `GET /api/v1/pdf/{file_id}` - Retrieve a specific PDF file
- `DELETE /api/v1/pdf/{file_id}` - Delete a PDF file

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (optional - returns mock data if not set)
- `GEMINI_MODEL` - Gemini model to use (default: gemini-1.5-pro)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: http://localhost:3000)
- `MAX_FILE_SIZE_MB` - Maximum file size in MB (default: 10)
- `UPLOAD_DIR` - Directory for uploaded files (default: ./uploads)

## Development

### Project Structure

```
app/
├── main.py              # FastAPI app initialization
├── config.py            # Configuration settings
├── api/
│   └── routes/
│       ├── pdf.py       # PDF endpoints
│       └── health.py    # Health check
├── services/
│   ├── pdf_processor.py # PDF text extraction
│   └── gemini_service.py # Gemini API integration
└── models/
    └── schemas.py       # Pydantic models
```
