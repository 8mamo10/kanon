'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  fileUrl: string;
  filename?: string;
}

export default function PDFViewer({ fileUrl, filename }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
          {filename || 'PDF Document'}
        </h3>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex justify-center">
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
            </div>
          )}
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="text-center py-8">Loading PDF...</div>}
            error={
              <div className="text-center py-8 text-red-600">
                Failed to load PDF. Please try again.
              </div>
            }
            className="shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="border border-gray-300 dark:border-gray-700"
            />
          </Document>
        </div>
      </div>

      {/* Navigation Controls */}
      {numPages > 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {pageNumber} of {numPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
