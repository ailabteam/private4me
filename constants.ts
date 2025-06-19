
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const AVAILABLE_GEMINI_MODELS: string[] = [
  'gemini-2.5-flash-preview-04-17',
  // Add other permitted Gemini models here if they become available and are supported
];

export const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-3.5-turbo'; 
export const AVAILABLE_OPENROUTER_MODELS: string[] = [
  'openai/gpt-3.5-turbo',
  'openai/gpt-4o',
  'openai/gpt-4-turbo',
  'google/gemini-pro', // Note: This is via OpenRouter, distinct from direct Gemini API use
  'google/gemini-2.5-flash-preview-04-17', // via OpenRouter
  'anthropic/claude-3-haiku-20240307',
  'anthropic/claude-3-sonnet-20240229',
  'anthropic/claude-3-opus-20240229',
  'mistralai/mistral-7b-instruct',
  'mistralai/mixtral-8x7b-instruct',
  // Add other popular/useful OpenRouter models
];


export const MAX_CONTEXT_LENGTH_WORDS = 3000; // Approximate limit for context

export const APP_TITLE = "Research Paper Assistant";

export const SEMANTIC_SCHOLAR_API_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';
export const PAPERS_PER_PAGE = 20;
export const PRACTICAL_SELECT_ALL_LIMIT = 1000; // Max papers to fetch for "Select All Across Pages"