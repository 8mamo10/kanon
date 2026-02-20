'use client';

import { useState } from 'react';
import type { AnalysisResult, PDFMetadata, ExtractedElement } from '@/lib/types';

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

  const renderExtractedElements = (elements: ExtractedElement[], title: string, sectionKey: string) => {
    if (!elements || elements.length === 0) return null;

    const copyText = elements.map(el =>
      `${el.value}\nCoordinates: x(${el.coordinate.x.left_x}, ${el.coordinate.x.right_x}), y(${el.coordinate.y.lower_y}, ${el.coordinate.y.upper_y})`
    ).join('\n\n');

    return (
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={() => copyToClipboard(copyText, sectionKey)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {copiedSection === sectionKey ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="space-y-3">
          {elements.map((element, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {element.value}
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                <span className="inline-block mr-4">
                  X: [{element.coordinate.x.left_x}, {element.coordinate.x.right_x}]
                </span>
                <span className="inline-block">
                  Y: [{element.coordinate.y.lower_y}, {element.coordinate.y.upper_y}]
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
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

      {/* Dimensions Section */}
      {renderExtractedElements(analysis.dimension, 'Dimensions', 'dimensions')}

      {/* Annotations Section */}
      {renderExtractedElements(analysis.annotation, 'Annotations', 'annotations')}

      {/* Title Block Section */}
      {renderExtractedElements(analysis.title_block, 'Title Block', 'title_block')}

      {/* Others Section */}
      {renderExtractedElements(analysis.others, 'Other Information', 'others')}

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
