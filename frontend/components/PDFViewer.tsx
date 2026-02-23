'use client';

import { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import TranslationOverlay from './TranslationOverlay';
import type { AnalysisResult, PageDimensions } from '@/lib/types';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  fileUrl: string;
  filename?: string;
  analysisData?: AnalysisResult;
}

export default function PDFViewer({ fileUrl, filename, analysisData }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions | null>(null);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

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

  const handlePageRenderSuccess = (page: any) => {
    setPageDimensions({
      width: page.width,
      height: page.height,
      originalWidth: page.originalWidth,
      originalHeight: page.originalHeight
    });
  };

  // Extract elements that should have translation overlays
  const translationElements = useMemo(() => {
    if (!analysisData) return [];
    return [
      ...(analysisData.annotation || []),
      ...(analysisData.title_block || [])
    ].filter(e => e.value_en && e.value_en.trim() !== '');
  }, [analysisData]);

  // Extract dimension elements for unit conversion overlays
  const dimensionElements = useMemo(() => {
    if (!analysisData) return [];
    return analysisData.dimension || [];
  }, [analysisData]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {filename || 'PDF Document'}
          </h3>
          {analysisData && (translationElements.length > 0 || dimensionElements.length > 0) && (
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                showOverlays
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
              }`}
              title={showOverlays ? 'Hide overlays' : 'Show overlays'}
            >
              {showOverlays ? 'Hide' : 'Show'} Overlays
            </button>
          )}
        </div>
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
            <div className="relative">
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="border border-gray-300 dark:border-gray-700"
                onRenderSuccess={handlePageRenderSuccess}
              />
              {pageDimensions && showOverlays && (
                <>
                  {translationElements.length > 0 && (
                    <TranslationOverlay
                      elements={translationElements}
                      pageDimensions={pageDimensions}
                      elementType="translation"
                    />
                  )}
                  {dimensionElements.length > 0 && (
                    <TranslationOverlay
                      elements={dimensionElements}
                      pageDimensions={pageDimensions}
                      elementType="dimension"
                    />
                  )}
                </>
              )}
            </div>
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
