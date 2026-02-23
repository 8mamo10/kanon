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

  // Convert mm values to inches (1 inch = 25.4 mm)
  const convertMmToInches = (value: string, category: string): string => {
    // Only convert for dimension category
    if (category !== 'dimension') {
      return '';
    }

    // Parse the value to extract number and unit
    // Expected formats: "100mm", "25.4mm", "5.5 mm", etc.
    const match = value.match(/^([\d.]+)\s*mm$/i);

    if (!match) {
      return ''; // Not a mm value, leave empty
    }

    const mmValue = parseFloat(match[1]);

    if (isNaN(mmValue)) {
      return ''; // Invalid number
    }

    // Convert mm to inches: inches = mm / 25.4
    const inches = mmValue / 25.4;

    // Format to 2 decimal places with inch symbol
    return `${inches.toFixed(2)}"`;
  };

  // Combine all extracted elements into table rows
  const getTableRows = () => {
    const rows: { category: string; value: string; value_en: string; unit_conversion: string }[] = [];

    if (analysis.dimension) {
      analysis.dimension.forEach(item => {
        rows.push({
          category: 'dimension',
          value: item.value,
          value_en: '', // Empty for dimensions
          unit_conversion: convertMmToInches(item.value, 'dimension')
        });
      });
    }

    if (analysis.annotation) {
      analysis.annotation.forEach(item => {
        rows.push({
          category: 'annotation',
          value: item.value,
          value_en: item.value_en || item.value, // Fallback to original if no translation
          unit_conversion: '' // Empty for non-dimension categories
        });
      });
    }

    if (analysis.title_block) {
      analysis.title_block.forEach(item => {
        rows.push({
          category: 'title_block',
          value: item.value,
          value_en: item.value_en || item.value, // Fallback to original if no translation
          unit_conversion: '' // Empty for non-dimension categories
        });
      });
    }

    return rows;
  };

  const tableRows = getTableRows();

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

      {/* Extracted Data Table */}
      {tableRows.length > 0 && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Extracted Data
            </h3>
            <button
              onClick={() => {
                const copyText = tableRows
                  .map(row => `${row.category}\t${row.value}\t${row.value_en}\t${row.unit_conversion}`)
                  .join('\n');
                copyToClipboard(`Category\tOriginal Text\tTranslated Text\tUnit Conversion\n${copyText}`, 'table');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {copiedSection === 'table' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Original Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Translated Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit Conversion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tableRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.value}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.value_en}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.unit_conversion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
