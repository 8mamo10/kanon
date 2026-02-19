# Setup Instructions

Follow these steps to get Kanon up and running on your local machine.

## Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env file and add your Gemini API key
# You can get a free API key from: https://ai.google.dev/
nano .env  # or use your preferred editor
```

Add to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory (open a new terminal)
cd frontend

# Install Node.js dependencies
pnpm install

# IMPORTANT: Copy PDF.js worker file to public directory
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js

# Optional: Create environment file (uses defaults if not created)
cp .env.local.example .env.local
```

### 3. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
pnpm dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

### 4. Verify Installation

1. **Check Backend Health:**
   - Open http://localhost:8000/docs in your browser
   - You should see the FastAPI Swagger documentation
   - Try the `/api/v1/health` endpoint - it should return:
     ```json
     {
       "status": "healthy",
       "gemini_api": "connected"
     }
     ```

2. **Check Frontend:**
   - Open http://localhost:3000 in your browser
   - You should see the Kanon PDF Analysis application
   - Drag and drop a PDF file to test

### 5. Test with a Sample PDF

1. Download or use any PDF file (max 10MB)
2. Drag and drop it onto the upload area
3. Click "Upload and Analyze"
4. Wait for analysis to complete (typically 10-30 seconds)
5. View results on the right panel

## Common Issues and Solutions

### Backend Issues

**Issue: "ModuleNotFoundError"**
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Issue: "Gemini API key not configured"**
- Check that `.env` file exists in `backend/` directory
- Verify `GEMINI_API_KEY` is set correctly
- Get API key from https://ai.google.dev/

**Issue: "Port 8000 already in use"**
```bash
# Kill the process using port 8000
# On macOS/Linux:
lsof -ti:8000 | xargs kill -9
# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend Issues

**Issue: "pdf.worker.min.js not found"**
```bash
cd frontend
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```

**Issue: "Cannot connect to API"**
- Verify backend is running on http://localhost:8000
- Check browser console for CORS errors
- Ensure `.env.local` has correct `NEXT_PUBLIC_API_URL`

**Issue: "Port 3000 already in use"**
```bash
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Verification Checklist

- [ ] Python 3.11+ installed
- [ ] Node.js v20+ installed
- [ ] pnpm installed
- [ ] Backend virtual environment created
- [ ] Backend dependencies installed
- [ ] Gemini API key configured in backend/.env
- [ ] Frontend dependencies installed
- [ ] PDF.js worker file copied to public/
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Health endpoint returns "healthy"
- [ ] Can upload and analyze a test PDF

## Next Steps

Once everything is working:

1. Try uploading different types of PDFs:
   - Research papers
   - Invoices
   - Reports
   - Scanned documents

2. Explore the analysis results:
   - Document summaries
   - Extracted entities and data
   - Document classification
   - Key insights

3. Check out the API documentation at http://localhost:8000/docs

## Need Help?

- Check the main [README.md](./README.md) for more information
- Review backend logs in Terminal 1
- Review frontend logs in Terminal 2
- Check browser console for errors (F12)
