# Setup Instructions

Choose your setup path based on what you want to test:

- **[Quick Start (No API Key)](#quick-start-no-api-key)** - 5 minutes, test PDF viewing with mock analysis data
- **[Full Setup (With Gemini)](#full-setup-with-gemini)** - 10 minutes, complete AI-powered analysis

---

## Quick Start (No API Key)

Test the PDF viewer functionality without configuring a Gemini API key. The app will use mock analysis data.

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# No .env file needed - app works without it!
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# IMPORTANT: Copy PDF.js worker file
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
WARNING:  Gemini API key not configured - analysis will return mock data
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

### 4. Test It Out

1. Open http://localhost:3000
2. Drag and drop any PDF file (max 10MB)
3. Click "Upload and Analyze"
4. See your PDF on the left and mock analysis on the right

### What You'll Get

- ✅ **Fully functional PDF viewer** with page navigation
- ✅ **PDF upload** with validation
- ✅ **All UI features** (copy to clipboard, file management)
- ℹ️ **Mock analysis data** (will show placeholder results)

### Check Status

Visit http://localhost:8000/api/v1/health - you should see:
```json
{
  "status": "healthy",
  "gemini_api": "not_configured"
}
```

This is normal! The app works fine without Gemini for testing PDF display.

### Ready for Real AI Analysis?

Continue to [Full Setup (With Gemini)](#full-setup-with-gemini) below to enable real analysis.

---

## Full Setup (With Gemini)

Get the complete experience with AI-powered PDF analysis using Google Gemini.

### Prerequisites

- Completed [Quick Start](#quick-start-no-api-key) above, OR
- Have Python 3.11+, Node.js v20+, and pnpm installed

### 1. Get Gemini API Key

1. Visit https://ai.google.dev/
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key (free tier available)
5. Copy your API key

### 2. Configure Backend

```bash
cd backend

# Create environment file
cp .env.example .env

# Edit .env and add your API key
nano .env  # or use your preferred editor
```

Add to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies (if not done already)

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
pnpm install
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Gemini service initialized with model: gemini-1.5-pro
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

### 5. Verify Gemini Connection

Visit http://localhost:8000/api/v1/health - you should see:
```json
{
  "status": "healthy",
  "gemini_api": "connected"
}
```

If you see `"gemini_api": "connected"`, you're all set!

### 6. Test with Real Analysis

1. Open http://localhost:3000
2. Upload a PDF file
3. Wait for analysis (typically 10-30 seconds)
4. View real AI analysis results:
   - Document summary
   - Extracted entities, dates, numbers
   - Document classification
   - Key insights

---

## Common Issues and Solutions

### Backend Issues

**"ModuleNotFoundError"**
```bash
source venv/bin/activate  # Make sure venv is activated
pip install -r requirements.txt
```

**"PyMuPDF installation failed" or "metadata-generation-failed"**

PyMuPDF requires compilation. Try these solutions:

```bash
# Solution 1: Upgrade pip and install separately
pip install --upgrade pip setuptools wheel
pip install pymupdf
pip install -r requirements.txt

# Solution 2 (macOS): Install Xcode command line tools
xcode-select --install
pip install -r requirements.txt

# Solution 3: Use Python 3.11 or 3.12 instead of 3.13+
# PyMuPDF may not have pre-built wheels for very new Python versions
brew install python@3.11
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**"Gemini API key not configured" (when you want real analysis)**
- Check that `.env` file exists in `backend/` directory
- Verify `GEMINI_API_KEY=your_key_here` is set correctly
- Get API key from https://ai.google.dev/

**"Port 8000 already in use"**
```bash
# On macOS/Linux:
lsof -ti:8000 | xargs kill -9

# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend Issues

**"pdf.worker.min.js not found"**
```bash
cd frontend
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```

**"Cannot connect to API"**
- Verify backend is running on http://localhost:8000
- Check browser console for CORS errors
- Check Terminal 1 for backend errors

**"Port 3000 already in use"**
```bash
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Verification Checklist

### Quick Start (No API Key)
- [ ] Python 3.11+ installed
- [ ] Node.js v20+ installed
- [ ] pnpm installed
- [ ] Backend virtual environment created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] PDF.js worker file copied to public/
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can upload and view a PDF
- [ ] Mock analysis results display

### Full Setup (With Gemini)
- [ ] All Quick Start items above
- [ ] Gemini API key obtained
- [ ] API key configured in backend/.env
- [ ] Health endpoint returns `"gemini_api": "connected"`
- [ ] Real analysis works (not mock data)
- [ ] Analysis completes in 10-60 seconds

---

## Next Steps

### For Quick Start Users
- Test PDF viewing with different documents
- Explore the UI features
- When ready, upgrade to Full Setup for real AI analysis

### For Full Setup Users
Try uploading different types of PDFs:
- Research papers
- Invoices
- Reports
- Scanned documents
- Multi-page documents

Explore the analysis results:
- Document summaries
- Extracted entities and data
- Document classification
- Key insights

Check out the API documentation at http://localhost:8000/docs

---

## Need Help?

- Check the main [README.md](./README.md) for more information
- Review backend logs in Terminal 1
- Review frontend logs in Terminal 2
- Check browser console for errors (F12)
- Visit http://localhost:8000/docs for API documentation
