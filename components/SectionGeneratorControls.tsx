
import React from 'react';
import { ApiProvider } from '../types';
import { SparklesIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface SectionGeneratorControlsProps {
  onGenerateSection: (sectionType: 'introduction' | 'relatedWorks') => void;
  selectedProvider: ApiProvider;
  onProviderChange: (provider: ApiProvider) => void;
  loading: boolean;
  canGenerate: boolean;
  
  // Model selection props
  selectedGeminiModel: string;
  onGeminiModelChange: (model: string) => void;
  availableGeminiModels: string[];
  
  selectedOpenRouterModel: string;
  onOpenRouterModelChange: (model: string) => void;
  availableOpenRouterModels: string[];
  isApiKeyAvailable: (provider: ApiProvider) => boolean;
}

const SectionGeneratorControls: React.FC<SectionGeneratorControlsProps> = ({
  onGenerateSection,
  selectedProvider,
  onProviderChange,
  loading,
  canGenerate,
  selectedGeminiModel,
  onGeminiModelChange,
  availableGeminiModels,
  selectedOpenRouterModel,
  onOpenRouterModelChange,
  availableOpenRouterModels,
  isApiKeyAvailable,
}) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Generate Paper Sections</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="apiProvider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AI Provider
          </label>
          <select
            id="apiProvider"
            name="apiProvider"
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value as ApiProvider)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            disabled={loading}
          >
            <option value={ApiProvider.GEMINI}>Gemini</option>
            <option value={ApiProvider.OPENROUTER}>OpenRouter</option>
          </select>
        </div>

        <div>
          {selectedProvider === ApiProvider.GEMINI && isApiKeyAvailable(ApiProvider.GEMINI) && (
            <>
              <label htmlFor="geminiModelSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gemini Model (for Generation)
              </label>
              <select
                id="geminiModelSelect"
                value={selectedGeminiModel}
                onChange={(e) => onGeminiModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                disabled={loading || availableGeminiModels.length === 0}
              >
                {availableGeminiModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </>
          )}

          {selectedProvider === ApiProvider.OPENROUTER && isApiKeyAvailable(ApiProvider.OPENROUTER) && (
            <>
              <label htmlFor="openRouterModelSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OpenRouter Model (for Generation)
              </label>
              <select
                id="openRouterModelSelect"
                value={selectedOpenRouterModel}
                onChange={(e) => onOpenRouterModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                disabled={loading || availableOpenRouterModels.length === 0}
              >
                {availableOpenRouterModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </>
          )}
           {( (selectedProvider === ApiProvider.GEMINI && !isApiKeyAvailable(ApiProvider.GEMINI)) ||
             (selectedProvider === ApiProvider.OPENROUTER && !isApiKeyAvailable(ApiProvider.OPENROUTER)) ) && (
                <div className="h-full flex items-end">
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Set API key for {selectedProvider} to select a model.
                    </p>
                </div>
           )}
        </div>
      </div>


      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => onGenerateSection('introduction')}
          disabled={loading || !canGenerate}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
          aria-label="Generate Introduction"
        >
          {loading ? <LoadingSpinner size="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
          Generate Introduction
        </button>
        <button
          onClick={() => onGenerateSection('relatedWorks')}
          disabled={loading || !canGenerate}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
          aria-label="Generate Related Works"
        >
          {loading ? <LoadingSpinner size="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
          Generate Related Works
        </button>
      </div>
      {!canGenerate && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Please search for papers, ensure relevant API keys are set for the chosen provider, and a model is selected (if applicable).</p>}
    </div>
  );
};

export default SectionGeneratorControls;
