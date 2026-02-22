'use client';

import { useState } from 'react';
import PDFUpload from '@/components/PDFUpload';
import PDFViewer from '@/components/PDFViewer';
import AnalysisResults from '@/components/AnalysisResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import { uploadAndAnalyzePDF, deletePDF, APIError } from '@/lib/api';
import type { PDFAnalysisResponse } from '@/lib/types';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<PDFAnalysisResponse | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError('');
    setAnalysisData(null);
    setPdfUrl('');

    try {
      // Upload and analyze
      const response = await uploadAndAnalyzePDF(file);
      setAnalysisData(response);

      // Create blob URL for PDF viewing
      const blob = new Blob([file], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (analysisData?.file_id) {
      try {
        await deletePDF(analysisData.file_id);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setAnalysisData(null);
    setPdfUrl('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Kanon PDF Analysis
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                AI-powered PDF analysis using Google Gemini
              </p>
            </div>
            {analysisData && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Upload New PDF
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-400 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!analysisData && !loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <PDFUpload onUpload={handleUpload} isLoading={loading} />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner message="Analyzing your PDF... This may take a moment." />
          </div>
        )}

        {analysisData && pdfUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Viewer - Left Side */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-[calc(100vh-12rem)]">
              <PDFViewer
                fileUrl={pdfUrl}
                filename={analysisData.filename}
                analysisData={analysisData.analysis}
              />
            </div>

            {/* Analysis Results - Right Side */}
            <div className="overflow-auto h-[calc(100vh-12rem)]">
              <AnalysisResults
                analysis={analysisData.analysis}
                metadata={analysisData.metadata}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Powered by Google Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
