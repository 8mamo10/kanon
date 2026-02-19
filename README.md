# Kanon - AI-Powered PDF Analysis Application

A full-stack web application for uploading and analyzing PDF files using Google Gemini AI. Upload any PDF document and get comprehensive insights including summaries, data extraction, document classification, and key findings.

## Features

- **PDF Upload**: Drag-and-drop or click to upload PDF files (up to 10MB)
- **AI Analysis**: Powered by Google Gemini 1.5 Pro for intelligent document understanding
- **PDF Viewer**: Built-in PDF viewer with page navigation
- **Comprehensive Analysis**:
  - Document summary
  - Document classification (type, industry)
  - Extracted data (entities, dates, numbers, topics)
  - Key insights and findings
- **Clean UI**: Modern, responsive interface built with Next.js and Tailwind CSS
- **Real-time Results**: See analysis results immediately alongside your PDF

## Architecture

This is a monorepo containing:

- **Backend**: FastAPI (Python) - PDF processing and Gemini AI integration
- **Frontend**: Next.js 14 (TypeScript) - Modern React application with Tailwind CSS

## Prerequisites

- **Node.js** v20 or higher
- **Python** 3.11 or higher
- **pnpm** package manager
- **Google Gemini API Key** (optional for testing - [Get one here](https://ai.google.dev/))

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd kanon
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (optional - app works without Gemini API for testing)
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Copy PDF.js worker (after installing dependencies)
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js

# Configure environment (optional)
cp .env.local.example .env.local
# Edit if you need to change the API URL (default: http://localhost:8000)
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

Frontend will be available at: http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Drag and drop a PDF file or click to select one
3. Click "Upload and Analyze"
4. View your PDF on the left and analysis results on the right
5. Navigate through PDF pages using Previous/Next buttons
6. Copy analysis sections to clipboard as needed
7. Click "Upload New PDF" to analyze another document

## Project Structure

```
kanon/
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── main.py        # FastAPI app entry point
│   │   ├── config.py      # Configuration settings
│   │   ├── api/routes/    # API endpoints
│   │   ├── services/      # Business logic
│   │   └── models/        # Pydantic schemas
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment template
│
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # API client and types
│   ├── public/           # Static assets
│   └── package.json      # Node dependencies
│
└── README.md             # This file
```

## API Documentation

### Endpoints

#### Health Check
```
GET /api/v1/health
```
Returns server health status and Gemini API connection status.

#### Upload and Analyze PDF
```
POST /api/v1/pdf/analyze
Content-Type: multipart/form-data
Body: file (PDF)
```
Uploads a PDF file, extracts text, and returns comprehensive AI analysis.

#### Get PDF
```
GET /api/v1/pdf/{file_id}
```
Retrieves a specific PDF file by its ID.

#### Delete PDF
```
DELETE /api/v1/pdf/{file_id}
```
Deletes a specific PDF file.

## Environment Variables

### Backend (.env)
- `GEMINI_API_KEY`: Your Google Gemini API key (optional - uses mock data if not set)
- `GEMINI_MODEL`: Gemini model to use (default: gemini-1.5-pro)
- `ALLOWED_ORIGINS`: CORS allowed origins (default: http://localhost:3000)
- `MAX_FILE_SIZE_MB`: Maximum upload size in MB (default: 10)
- `UPLOAD_DIR`: Directory for uploaded files (default: ./uploads)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --log-level debug
```

### Frontend Development
```bash
cd frontend
pnpm dev
```

### Testing
Upload various types of PDFs to test:
- Text-based documents (articles, reports)
- Scanned documents (invoices, forms)
- Multi-page documents
- Documents with tables and images

## Troubleshooting

### Backend Issues

**Analysis shows mock data**
- This is normal if you haven't configured a Gemini API key
- The app works without Gemini for testing PDF display
- To enable real AI analysis, add your API key to `backend/.env`:
  - Create `.env` file: `cp .env.example .env`
  - Add your key: `GEMINI_API_KEY=your_key_here`
  - Get a free key from https://ai.google.dev/

**"Module not found" errors**
- Activate virtual environment: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Issues

**"pdf.worker.min.js not found"**
- After `pnpm install`, copy the worker file:
  ```bash
  cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
  ```

**"Cannot connect to backend"**
- Ensure backend is running on port 8000
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PyMuPDF**: PDF text extraction and processing
- **Google Gemini API**: AI-powered document analysis
- **Pydantic**: Data validation and settings management

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **react-pdf**: PDF viewing component
- **axios**: HTTP client
- **react-dropzone**: Drag-and-drop file upload

## Future Enhancements

- [ ] Asynchronous analysis for large files with progress tracking
- [ ] User authentication and analysis history
- [ ] Batch upload and comparison features
- [ ] Custom analysis prompts
- [ ] Database integration (PostgreSQL)
- [ ] Cloud deployment (Vercel + Cloud Run)
- [ ] Docker containerization
- [ ] Automated testing (pytest, Jest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.