
export interface Paper {
  paperId: string;
  title: string;
  authors: { name: string }[];
  year: number | null;
  abstract: string | null;
  url: string | null;
  venue: string | null;
  citationCount: number | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export enum ApiProvider {
  GEMINI = 'Gemini',
  OPENROUTER = 'OpenRouter',
}

export type ApiKeyName = 'semanticScholar' | 'gemini' | 'openRouter';

export interface ApiKeys {
  semanticScholar: string;
  gemini: string;
  openRouter: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  retrievedContext?: {
    uri: string;
    title: string;
  };
  // Add other possible types if necessary
}

export interface SemanticScholarSearchResponse {
  papers: Paper[];
  total: number;
  offset: number; // The offset that was used for this request
}
