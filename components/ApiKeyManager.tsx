
import React, { useState } from 'react';
import { ApiKeys, ApiKeyName } from '../types';
import { KeyIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface ApiKeyManagerProps {
  apiKeys: ApiKeys;
  onApiKeyChange: (name: ApiKeyName, value: string) => void;
}

const ApiKeyInput: React.FC<{
  label: string;
  name: ApiKeyName;
  value: string;
  onChange: (name: ApiKeyName, value: string) => void;
}> = ({ label, name, value, onChange }) => {
  const [showKey, setShowKey] = useState(false);
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={`Enter ${label}`}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label={showKey ? "Hide API key" : "Show API key"}
        >
          {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKeys, onApiKeyChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 md:p-4 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2"
      >
        <div className="flex items-center">
          <KeyIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
          API Key Configuration
        </div>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      {isOpen && (
        <div className="space-y-4 pt-2">
          <ApiKeyInput label="Semantic Scholar API Key" name="semanticScholar" value={apiKeys.semanticScholar} onChange={onApiKeyChange} />
          <ApiKeyInput label="Gemini API Key" name="gemini" value={apiKeys.gemini} onChange={onApiKeyChange} />
          <ApiKeyInput label="OpenRouter API Key" name="openRouter" value={apiKeys.openRouter} onChange={onApiKeyChange} />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your API keys are stored in your browser's local storage and are not sent to any server other than the respective API providers.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
