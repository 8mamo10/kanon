'use client';

import { useState } from 'react';
import type { AnalysisResult, PDFMetadata } from '@/lib/types';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  metadata: PDFMetadata;
}

export default function AnalysisResults({ analysis, metadata }: AnalysisResultsProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Summary
          </h3>
          <button
            onClick={() => copyToClipboard(analysis.summary, 'summary')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {copiedSection === 'summary' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
          {analysis.summary}
        </p>
      </section>

      {/* Classification Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Document Classification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {analysis.classification.document_type}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Industry</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {analysis.classification.industry}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Confidence</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {analysis.classification.confidence}
            </p>
          </div>
        </div>
      </section>

      {/* Key Insights Section */}
      {analysis.key_insights && analysis.key_insights.length > 0 && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Key Insights
            </h3>
            <button
              onClick={() => copyToClipboard(analysis.key_insights.join('\n'), 'insights')}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {copiedSection === 'insights' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <ul className="space-y-2">
            {analysis.key_insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Extracted Data Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Extracted Data
        </h3>
        <div className="space-y-4">
          {/* Key Entities */}
          {analysis.extracted_data.key_entities.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Key Entities
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.extracted_data.key_entities.map((entity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {analysis.extracted_data.topics.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Topics
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.extracted_data.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          {analysis.extracted_data.dates.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Important Dates
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.extracted_data.dates.map((date, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Numbers */}
          {analysis.extracted_data.numbers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Key Numbers
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.extracted_data.numbers.map((number, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm"
                  >
                    {number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Metadata Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Document Metadata
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Pages</dt>
            <dd className="mt-1 text-gray-900 dark:text-gray-100">{metadata.page_count}</dd>
          </div>
          {metadata.title && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Title</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">{metadata.title}</dd>
            </div>
          )}
          {metadata.author && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Author</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">{metadata.author}</dd>
            </div>
          )}
          {metadata.creator && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Creator</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">{metadata.creator}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
