
import React from 'react';
import { GroundingChunk } from '../types';

interface GeneratedSectionDisplayProps {
  title: string;
  content: string;
  loading: boolean;
  error: string | null;
  groundingSources?: GroundingChunk[];
}

const GeneratedSectionDisplay: React.FC<GeneratedSectionDisplayProps> = ({ title, content, loading, error, groundingSources }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
      {loading && <p className="text-gray-600 dark:text-gray-300">Generating {title.toLowerCase()}...</p>}
      {error && <p className="text-red-600 dark:text-red-400">Error: {error}</p>}
      {content && (
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          {content}
        </div>
      )}
      {groundingSources && groundingSources.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Sources (from Google Search Grounding):</h4>
          <ul className="list-disc list-inside text-xs space-y-1">
            {groundingSources.map((chunk, index) => {
              const source = chunk.web || chunk.retrievedContext;
              if (source?.uri) {
                return (
                  <li key={index}>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 underline">
                      {source.title || source.uri}
                    </a>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GeneratedSectionDisplay;
