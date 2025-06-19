
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ApiProvider } from '../types';
import { PaperAirplaneIcon, SparklesIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (messageText: string, provider: ApiProvider, model: string) => Promise<void>;
  loading: boolean;
  chatError: string | null;
  activeProvider: ApiProvider;
  onProviderChange: (provider: ApiProvider) => void; 
  isApiKeySet: (provider: ApiProvider) => boolean;

  // Model selection props
  selectedGeminiModel: string;
  onGeminiModelChange: (model: string) => void;
  availableGeminiModels: string[];
  
  selectedOpenRouterModel: string;
  onOpenRouterModelChange: (model: string) => void;
  availableOpenRouterModels: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, onSendMessage, loading, chatError, 
  activeProvider, onProviderChange, isApiKeySet,
  selectedGeminiModel, onGeminiModelChange, availableGeminiModels,
  selectedOpenRouterModel, onOpenRouterModelChange, availableOpenRouterModels
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentModel = activeProvider === ApiProvider.GEMINI ? selectedGeminiModel : selectedOpenRouterModel;
    if (input.trim() && !loading && isApiKeySet(activeProvider) && currentModel) {
      await onSendMessage(input.trim(), activeProvider, currentModel);
      setInput('');
    } else if (!isApiKeySet(activeProvider)) {
        alert(`Please set the API key for ${activeProvider} to use the chat.`);
    } else if (!currentModel) {
        alert(`Please select a model for ${activeProvider} to use the chat.`);
    }
  };
  
  const currentModelForChat = activeProvider === ApiProvider.GEMINI ? selectedGeminiModel : selectedOpenRouterModel;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg flex flex-col h-[500px] sm:h-[600px] md:h-[700px] lg:h-auto lg:min-h-[600px]">
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
            AI Chat
            </h2>
            <select
                id="chatApiProvider"
                name="chatApiProvider"
                value={activeProvider}
                onChange={(e) => onProviderChange(e.target.value as ApiProvider)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm text-xs"
                disabled={loading}
            >
                <option value={ApiProvider.GEMINI}>Gemini</option>
                <option value={ApiProvider.OPENROUTER}>OpenRouter</option>
            </select>
        </div>
        
        {/* Model Selection for Chat */}
        {activeProvider === ApiProvider.GEMINI && isApiKeySet(ApiProvider.GEMINI) && (
            <div className="mt-2">
            <label htmlFor="chatGeminiModelSelect" className="sr-only">Gemini Model for Chat</label>
            <select
                id="chatGeminiModelSelect"
                value={selectedGeminiModel}
                onChange={(e) => onGeminiModelChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm text-xs"
                disabled={loading || availableGeminiModels.length === 0}
            >
                {availableGeminiModels.map(model => (
                <option key={model} value={model}>{model}</option>
                ))}
            </select>
            </div>
        )}
        {activeProvider === ApiProvider.OPENROUTER && isApiKeySet(ApiProvider.OPENROUTER) && (
            <div className="mt-2">
            <label htmlFor="chatOpenRouterModelSelect" className="sr-only">OpenRouter Model for Chat</label>
            <select
                id="chatOpenRouterModelSelect"
                value={selectedOpenRouterModel}
                onChange={(e) => onOpenRouterModelChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm text-xs"
                disabled={loading || availableOpenRouterModels.length === 0}
            >
                {availableOpenRouterModels.map(model => (
                <option key={model} value={model}>{model}</option>
                ))}
            </select>
            </div>
        )}
      </div>
      
      <div className="flex-grow overflow-y-auto mb-3 pr-2 space-y-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md min-h-[200px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2.5 rounded-lg shadow ${
              msg.sender === 'user' 
                ? 'bg-primary-500 text-white rounded-br-none' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs mt-1 opacity-70 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-[70%] p-2.5 rounded-lg shadow bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-none">
                <LoadingSpinner size="w-5 h-5" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {chatError && <p className="text-red-500 dark:text-red-400 text-xs mb-2 text-center">{chatError}</p>}
      <form onSubmit={handleSend} className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={!isApiKeySet(activeProvider) ? `Set ${activeProvider} API key first...` : (!currentModelForChat ? `Select model for ${activeProvider}...` : `Ask ${activeProvider} (${currentModelForChat.split('/').pop()})...`)}
          className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          disabled={loading || !isApiKeySet(activeProvider) || !currentModelForChat}
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || !isApiKeySet(activeProvider) || !currentModelForChat}
          className="inline-flex items-center justify-center p-2.5 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
