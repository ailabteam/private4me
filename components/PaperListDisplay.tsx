
import React from 'react';
import { Paper } from '../types';
import PaperItem from './PaperItem';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface PaperListDisplayProps {
  papers: Paper[];
  selectedPaperIds: Set<string>;
  onToggleSelectPaper: (paperId: string) => void;
  loading: boolean; // For page loading or initial search loading
  error: string | null;
  currentPage: number;
  totalPapers: number;
  papersPerPage: number;
  onPageChange: (newPage: number) => void;
  researchTopicPresent: boolean;
  onSelectAllOnPage: () => void;
  onDeselectAll: () => void;
  onSelectAllAcrossPages: () => void;
  selectingAllPapersLoading: boolean; // Specific loading for "select all across pages"
  practicalSelectAllLimit: number;
}

const PaginationControls: React.FC<{
  currentPage: number;
  totalPapers: number;
  papersPerPage: number;
  onPageChange: (newPage: number) => void;
}> = ({ currentPage, totalPapers, papersPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalPapers / papersPerPage);
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 5; 
  const halfMaxPages = Math.floor(maxPagesToShow / 2);

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    let startPage = Math.max(2, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages);

    if (currentPage - halfMaxPages <= 2) {
        endPage = Math.min(totalPages -1, maxPagesToShow -1 ) ;
    }
    if (currentPage + halfMaxPages >= totalPages -1) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 2);
    }
    
    if (startPage > 2) {
      pageNumbers.push(-1); 
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push(-1); 
    }
    pageNumbers.push(totalPages);
  }

  return (
    <nav aria-label="Paper search results pagination" className="flex items-center justify-between mt-4 px-1">
      <div>
        {totalPapers > 0 && (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{(currentPage - 1) * papersPerPage + 1}</span>
          - <span className="font-medium">{Math.min(currentPage * papersPerPage, totalPapers)}</span> of{' '}
          <span className="font-medium">{totalPapers}</span> results
        </p>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {pageNumbers.map((page, index) =>
          page === -1 ? (
            <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === page
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};


const PaperListDisplay: React.FC<PaperListDisplayProps> = ({ 
    papers, 
    selectedPaperIds, 
    onToggleSelectPaper, 
    loading, 
    error,
    currentPage,
    totalPapers,
    papersPerPage,
    onPageChange,
    researchTopicPresent,
    onSelectAllOnPage,
    onDeselectAll,
    onSelectAllAcrossPages,
    selectingAllPapersLoading,
    practicalSelectAllLimit
}) => {
  if (loading && papers.length === 0) {
    return <p className="text-center text-gray-600 dark:text-gray-300 py-4">Loading papers...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 dark:text-red-400 py-4">Error: {error}</p>;
  }

  if (!researchTopicPresent && totalPapers === 0 && !loading) {
    return <p className="text-center text-gray-600 dark:text-gray-300 py-4">Please enter a research topic to search for papers.</p>;
  }
  
  if (researchTopicPresent && papers.length === 0 && !loading && totalPapers === 0) {
    return <p className="text-center text-gray-600 dark:text-gray-300 py-4">No papers found for this topic. Try a different search.</p>;
  }

  const numSelected = selectedPaperIds.size;
  const displaySelectAllCount = totalPapers > practicalSelectAllLimit ? `${practicalSelectAllLimit} of ${totalPapers}` : totalPapers;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 shadow-inner rounded-lg">
      <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Search Results
        </h2>
        <div className="flex items-center space-x-2 flex-wrap gap-1">
            <button 
                onClick={onSelectAllOnPage}
                disabled={loading || papers.length === 0 || selectingAllPapersLoading}
                className="px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-700/30 hover:bg-primary-200 dark:hover:bg-primary-600/40 rounded-md disabled:opacity-50"
            >
                Select Current Page ({papers.length})
            </button>
            {numSelected > 0 && (
                 <button 
                    onClick={onDeselectAll}
                    disabled={selectingAllPapersLoading}
                    className="px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-700/30 hover:bg-red-200 dark:hover:bg-red-600/40 rounded-md disabled:opacity-50"
                >
                    Deselect All ({numSelected})
                </button>
            )}
            {totalPapers > 0 && (
                <button 
                    onClick={onSelectAllAcrossPages}
                    disabled={loading || selectingAllPapersLoading || totalPapers === 0}
                    className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-700/30 hover:bg-green-200 dark:hover:bg-green-600/40 rounded-md disabled:opacity-50 flex items-center"
                >
                    {selectingAllPapersLoading && <LoadingSpinner size="w-3 h-3 mr-1.5" />}
                    Select All ({displaySelectAllCount})
                </button>
            )}
             <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {numSelected} selected
            </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Select papers for context. If none selected, current page papers used (up to limit). "Select All" fetches up to {practicalSelectAllLimit} papers.
      </p>
      
      {loading && papers.length > 0 && <p className="text-center text-sm text-primary-600 dark:text-primary-400 py-2">Updating results...</p>}

      {papers.length > 0 ? (
        <ul className="space-y-3 max-h-[50vh] min-h-[20vh] overflow-y-auto pr-2">
            {papers.map((paper) => (
            <PaperItem
                key={paper.paperId}
                paper={paper}
                isSelected={selectedPaperIds.has(paper.paperId)}
                onToggleSelect={onToggleSelectPaper}
            />
            ))}
        </ul>
      ) : (
        !loading && researchTopicPresent && <p className="text-center text-gray-600 dark:text-gray-300 py-4">No papers on this page. Try other pages or a new search.</p>
      )}
      <PaginationControls
        currentPage={currentPage}
        totalPapers={totalPapers}
        papersPerPage={papersPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default PaperListDisplay;
