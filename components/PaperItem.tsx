
import React from 'react';
import { Paper } from '../types';

interface PaperItemProps {
  paper: Paper;
  isSelected: boolean;
  onToggleSelect: (paperId: string) => void;
}

const PaperItem: React.FC<PaperItemProps> = ({ paper, isSelected, onToggleSelect }) => {
  return (
    <li className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-lg transition-shadow duration-200 flex items-start space-x-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(paper.paperId)}
        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
        aria-labelledby={`paper-title-${paper.paperId}`}
      />
      <div className="flex-1">
        <h3 id={`paper-title-${paper.paperId}`} className="text-md font-semibold text-primary-700 dark:text-primary-400">
          {paper.url ? (
            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {paper.title || 'N/A'}
            </a>
          ) : (
            paper.title || 'N/A'
          )}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {paper.authors?.map(a => a.name).join(', ') || 'N/A'} ({paper.year || 'N/A'})
          {paper.venue && <span className="italic"> - {paper.venue}</span>}
          {paper.citationCount !== null && <span className="ml-2">| Citations: {paper.citationCount}</span>}
        </p>
        {paper.abstract && (
          <details className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-300">Abstract</summary>
            <p className="mt-1 whitespace-pre-line">{paper.abstract}</p>
          </details>
        )}
      </div>
    </li>
  );
};

export default PaperItem;
