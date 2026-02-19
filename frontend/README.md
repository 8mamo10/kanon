# Kanon Frontend

Next.js frontend for PDF analysis application.

## Setup

### Prerequisites

- Node.js v20 or higher
- pnpm package manager

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local if needed (default: http://localhost:8000)
```

## Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── page.tsx           # Main application page
├── layout.tsx         # Root layout
└── globals.css        # Global styles (Tailwind)

components/
├── PDFUpload.tsx      # Drag-and-drop upload component
├── PDFViewer.tsx      # PDF display component
├── AnalysisResults.tsx # Analysis results display
└── LoadingSpinner.tsx # Loading indicator

lib/
└── api.ts             # API client for backend

public/
└── pdf.worker.min.js  # PDF.js worker
```

## Features

- Drag-and-drop PDF upload
- PDF viewing with page navigation
- AI-powered analysis using Google Gemini
- Clean, responsive UI with Tailwind CSS
- Real-time analysis results display

## Build for Production

```bash
pnpm build
pnpm start
```
