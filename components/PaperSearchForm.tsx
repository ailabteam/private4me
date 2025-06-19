
import React, { useState } from 'react';
import { SearchIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface PaperSearchFormProps {
  onSearch: (topic: string) => void;
  loading: boolean;
}

const PaperSearchForm: React.FC<PaperSearchFormProps> = ({ onSearch, loading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSearch(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <label htmlFor="searchTopic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Research Topic
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          id="searchTopic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Quantum Entanglement in Photosynthesis"
          className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
        >
          {loading ? <LoadingSpinner size="w-5 h-5" /> : <SearchIcon className="w-5 h-5 mr-2" />}
          Search
        </button>
      </div>
    </form>
  );
};

export default PaperSearchForm;
