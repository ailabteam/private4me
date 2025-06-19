
import React, { useState, useEffect, useCallback } from 'react';
import { Paper, ChatMessage, ApiProvider, ApiKeyName, ApiKeys, GroundingChunk } from './types';
import { 
    APP_TITLE, MAX_CONTEXT_LENGTH_WORDS, 
    GEMINI_TEXT_MODEL, OPENROUTER_DEFAULT_MODEL, 
    PAPERS_PER_PAGE, PRACTICAL_SELECT_ALL_LIMIT,
    AVAILABLE_GEMINI_MODELS, AVAILABLE_OPENROUTER_MODELS
} from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import ApiKeyManager from './components/ApiKeyManager';
import PaperSearchForm from './components/PaperSearchForm';
import PaperListDisplay from './components/PaperListDisplay';
import SectionGeneratorControls from './components/SectionGeneratorControls';
import GeneratedSectionDisplay from './components/GeneratedSectionDisplay';
import ChatWindow from './components/ChatWindow';
import { searchSemanticScholarPapers, SemanticScholarSearchResponse, fetchAllPapersForTopic } from './services/semanticScholar';
import { generateTextWithGemini, startOrContinueChatWithGemini, resetGeminiChat, GeminiGenerateTextResult } from './services/gemini';
import { generateTextWithOpenRouter, chatWithOpenRouter, OpenRouterMessage } from './services/openrouter';
import { Content } from '@google/genai'; 

const App: React.FC = () => {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('apiKeys', {
    semanticScholar: '',
    gemini: '',
    openRouter: '',
  });
  const [researchTopic, setResearchTopic] = useLocalStorage<string>('researchTopic', '');
  const [papers, setPapers] = useState<Paper[]>([]); 
  const [selectedPaperIds, setSelectedPaperIds] = useLocalStorage<string[]>('selectedPaperIds', []);
  
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useLocalStorage<number>('currentPage', 1);
  const [totalPapers, setTotalPapers] = useLocalStorage<number>('totalPapers', 0);
  
  const [cachedPapers, setCachedPapers] = useState<Map<string, Paper>>(new Map());
  const [selectingAllPapersLoading, setSelectingAllPapersLoading] = useState<boolean>(false);


  const [generationProvider, setGenerationProvider] = useLocalStorage<ApiProvider>('generationProvider', ApiProvider.GEMINI);
  const [introContent, setIntroContent] = useLocalStorage<string>('introContent', '');
  const [relatedWorksContent, setRelatedWorksContent] = useLocalStorage<string>('relatedWorksContent', '');
  const [introGrounding, setIntroGrounding] = useLocalStorage<GroundingChunk[] | undefined>('introGrounding', undefined);
  const [relatedWorksGrounding, setRelatedWorksGrounding] = useLocalStorage<GroundingChunk[] | undefined>('relatedWorksGrounding', undefined);
  const [generationLoading, setGenerationLoading] = useState<boolean>(false);
  const [introError, setIntroError] = useState<string | null>(null);
  const [relatedWorksError, setRelatedWorksError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('chatMessages', []);
  const [chatProvider, setChatProvider] = useLocalStorage<ApiProvider>('chatProvider', ApiProvider.GEMINI);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const [geminiChatHistory, setGeminiChatHistory] = useLocalStorage<Content[]>('geminiChatHistory', []);
  const [openRouterChatHistory, setOpenRouterChatHistory] = useLocalStorage<OpenRouterMessage[]>('openRouterChatHistory', []);

  // Model Selection State
  const [selectedGeminiModel, setSelectedGeminiModel] = useLocalStorage<string>(
    'selectedGeminiModel', 
    AVAILABLE_GEMINI_MODELS[0] || GEMINI_TEXT_MODEL
  );
  const [selectedOpenRouterModel, setSelectedOpenRouterModel] = useLocalStorage<string>(
    'selectedOpenRouterModel', 
    AVAILABLE_OPENROUTER_MODELS[0] || OPENROUTER_DEFAULT_MODEL
  );

  const handleApiKeyChange = (name: ApiKeyName, value: string) => {
    setApiKeys(prev => ({ ...prev, [name]: value }));
    if (name === 'gemini') {
        resetGeminiChat(); 
        setGeminiChatHistory([]);
    }
     if (name === 'openRouter') {
        setOpenRouterChatHistory([]);
    }
  };

  const handleSelectedGeminiModelChange = (model: string) => {
    setSelectedGeminiModel(model);
    resetGeminiChat(); // Reset chat instance as model has changed
    setGeminiChatHistory([]); // Clear history for the new model
  };

  const handleSelectedOpenRouterModelChange = (model: string) => {
    setSelectedOpenRouterModel(model);
    setOpenRouterChatHistory([]); // Clear history for the new model
  };


  const fetchPapersForPage = async (topic: string, page: number) => {
    if (!apiKeys.semanticScholar) {
      setSearchError("Semantic Scholar API key is not set.");
      setPapers([]);
      setTotalPapers(0);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const offset = (page - 1) * PAPERS_PER_PAGE;
      const response: SemanticScholarSearchResponse = await searchSemanticScholarPapers(
        topic, 
        apiKeys.semanticScholar, 
        PAPERS_PER_PAGE, 
        offset
      );
      setPapers(response.papers);
      setTotalPapers(response.total);
      setCurrentPage(page);
      setCachedPapers(prevCache => {
        const newCache = new Map(prevCache);
        response.papers.forEach(p => newCache.set(p.paperId, p));
        return newCache;
      });
    } catch (err: any) {
      setSearchError(err.message || "Failed to fetch papers.");
      setPapers([]); 
      setTotalPapers(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (topic: string) => {
    setResearchTopic(topic);
    setSelectedPaperIds([]); 
    setIntroContent(''); 
    setRelatedWorksContent('');
    setIntroGrounding(undefined);
    setRelatedWorksGrounding(undefined);
    setCachedPapers(new Map()); 
    await fetchPapersForPage(topic, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (researchTopic) {
      fetchPapersForPage(researchTopic, newPage);
    }
  };

  const toggleSelectPaper = (paperId: string) => {
    setSelectedPaperIds(prevArray => {
      const newSet = new Set(prevArray);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return Array.from(newSet);
    });
  };

  const handleSelectAllOnPage = () => {
    const paperIdsOnPage = papers.map(p => p.paperId);
    setSelectedPaperIds(prevArray => {
        const newSet = new Set(prevArray);
        paperIdsOnPage.forEach(id => newSet.add(id));
        return Array.from(newSet);
    });
  };

  const handleDeselectAllPapers = () => {
    setSelectedPaperIds([]);
  };

  const handleSelectAllAcrossPages = async () => {
    if (!researchTopic || !apiKeys.semanticScholar) {
      setSearchError("Cannot select all papers without a topic and Semantic Scholar API key.");
      return;
    }
    setSelectingAllPapersLoading(true);
    setSearchError(null);
    try {
      const allFoundPapers = await fetchAllPapersForTopic(researchTopic, apiKeys.semanticScholar, PRACTICAL_SELECT_ALL_LIMIT);
      setCachedPapers(prevCache => {
        const newCache = new Map(prevCache);
        allFoundPapers.forEach(p => newCache.set(p.paperId, p));
        return newCache;
      });
      setSelectedPaperIds(allFoundPapers.map(p => p.paperId));
    } catch (err: any) {
      setSearchError(err.message || "Failed to fetch all papers.");
    } finally {
      setSelectingAllPapersLoading(false);
    }
  };

  const getContextFromSelectedPapers = (): string => {
    let context = "";
    let wordCount = 0;
    let paperCounter = 1;
    const papersToConsider: Paper[] = [];
    const currentSelectedPaperIdSet = new Set(selectedPaperIds);

    if (currentSelectedPaperIdSet.size > 0) {
        currentSelectedPaperIdSet.forEach(id => {
            const paper = cachedPapers.get(id);
            if (paper) papersToConsider.push(paper);
        });
    } else {
        papers.forEach(p => { 
            const cachedPaper = cachedPapers.get(p.paperId);
            if(cachedPaper) papersToConsider.push(cachedPaper);
        });
    }
    
    papersToConsider.sort((a, b) => {
        const citationDiff = (b.citationCount ?? 0) - (a.citationCount ?? 0);
        if (citationDiff !== 0) return citationDiff;
        return (b.year ?? 0) - (a.year ?? 0);
    });

    for (const p of papersToConsider) {
        const authorNames = p.authors?.map(a => a.name).join(', ') || 'N/A';
        const paperInfo = `[${paperCounter}] Title: ${p.title}\nAuthors: ${authorNames}\nYear: ${p.year || 'N/A'}\nVenue: ${p.venue || 'N/A'}\nURL: ${p.url || 'N/A'}\nAbstract: ${p.abstract || 'N/A'}\n\n`;
        const currentPaperWordCount = paperInfo.split(/\s+/).length;

        if (wordCount + currentPaperWordCount <= MAX_CONTEXT_LENGTH_WORDS) {
            context += paperInfo;
            wordCount += currentPaperWordCount;
            paperCounter++;
        } else {
            break; 
        }
    }
    return context.trim();
  };


  const handleGenerateSection = async (sectionType: 'introduction' | 'relatedWorks') => {
    const context = getContextFromSelectedPapers();
    if (!researchTopic) {
      alert("Please search for a topic first."); return;
    }
    if (!context) {
      alert("No papers available to provide context."); return;
    }

    const apiKey = generationProvider === ApiProvider.GEMINI ? apiKeys.gemini : apiKeys.openRouter;
    const modelToUse = generationProvider === ApiProvider.GEMINI ? selectedGeminiModel : selectedOpenRouterModel;

    if (!apiKey) {
      alert(`API key for ${generationProvider} is not set.`); return;
    }
    if (!modelToUse) {
      alert(`Model for ${generationProvider} is not selected.`); return;
    }


    setGenerationLoading(true);
    if (sectionType === 'introduction') {
      setIntroError(null); setIntroContent(''); setIntroGrounding(undefined);
    } else {
      setRelatedWorksError(null); setRelatedWorksContent(''); setRelatedWorksGrounding(undefined);
    }

    const promptAction = sectionType === 'introduction' ? "an introduction" : "a related works section";
    const prompt = `
You are an academic writing assistant. Based on the following research papers (each prefixed with a number like [1], [2], etc.) related to the research topic "${researchTopic}", write ${promptAction} for a new research paper.
Instructions:
1. The tone should be academic, formal, and objective.
2. Synthesize information from the provided papers to create a coherent narrative. Do not simply summarize each paper individually.
3. When you use information or ideas from a specific paper in the context, you MUST cite it using its corresponding number in square brackets (e.g., [1], [2]).
4. Ensure that citations are placed appropriately within the text.
5. At the end of the generated section, you MUST include a 'References' section.
6. In the 'References' section, list all papers that you cited. Use the corresponding number for each reference.
7. For each reference, include the authors, year, title, and venue. If a URL is available, you can include it. Format example:
   [1] Author, A. A., & Author, B. B. (Year). Title of paper. *Venue*. URL (if available)
   [2] Author, C. C., et al. (Year). Another title. *Conference or Journal Name*.
Context Papers:
${context}
Begin the ${promptAction} now:`;
    const systemInstruction = `You are an expert academic writing assistant specializing in drafting research paper sections with proper citations and references according to the user's detailed instructions. Adhere strictly to the citation and reference formatting provided.`;

    try {
      let resultText = '';
      let groundingData: GroundingChunk[] | undefined = undefined;

      if (generationProvider === ApiProvider.GEMINI) {
        const geminiResult: GeminiGenerateTextResult = await generateTextWithGemini(apiKey, prompt, modelToUse, systemInstruction, false); 
        resultText = geminiResult.text;
      } else { 
        resultText = await generateTextWithOpenRouter(apiKey, prompt, modelToUse, systemInstruction);
      }
      
      if (sectionType === 'introduction') {
        setIntroContent(resultText); setIntroGrounding(groundingData);
      } else {
        setRelatedWorksContent(resultText); setRelatedWorksGrounding(groundingData);
      }
    } catch (err: any) {
      if (sectionType === 'introduction') setIntroError(err.message);
      else setRelatedWorksError(err.message);
    } finally {
      setGenerationLoading(false);
    }
  };

  const isApiKeySet = useCallback((provider: ApiProvider): boolean => {
    if (provider === ApiProvider.GEMINI) return !!apiKeys.gemini;
    if (provider === ApiProvider.OPENROUTER) return !!apiKeys.openRouter;
    return false;
  }, [apiKeys]);

  const handleSendMessage = async (messageText: string, provider: ApiProvider, model: string) => {
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: messageText, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);
    setChatError(null);

    const apiKey = provider === ApiProvider.GEMINI ? apiKeys.gemini : apiKeys.openRouter;
    if (!apiKey || !model) { // Also check for model
      const errorMsg = !apiKey ? `API key for ${provider} is not set.` : `Model for ${provider} is not selected.`;
      setChatError(errorMsg);
      setChatLoading(false);
      const errorAiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: `Error: ${errorMsg}`, timestamp: new Date() };
      setChatMessages(prev => [...prev, errorAiMsg]);
      return;
    }
    
    const chatSystemInstruction = "You are a helpful AI assistant specialized in research-related queries. Be concise and informative.";

    try {
      let aiResponseText = '';
      if (provider === ApiProvider.GEMINI) {
        const { text: geminiText, updatedHistory: newGeminiHistory } = await startOrContinueChatWithGemini(apiKey, messageText, geminiChatHistory, model, chatSystemInstruction);
        aiResponseText = geminiText;
        setGeminiChatHistory(newGeminiHistory);
      } else { 
        const currentOpenRouterHistory = openRouterChatHistory.length > 0 ? openRouterChatHistory : [];
        const { text: orText, updatedHistory: newOrHistory } = await chatWithOpenRouter(apiKey, messageText, currentOpenRouterHistory, model, chatSystemInstruction);
        aiResponseText = orText;
        setOpenRouterChatHistory(newOrHistory);
      }
      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponseText, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setChatError(err.message || `Failed to get response from ${provider}.`);
      const aiErrorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: `Error: ${err.message}`, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiErrorMessage]);
    } finally {
      setChatLoading(false);
    }
  };
  
  useEffect(() => {
    // Reset Gemini chat if provider or its specific model changes
    if (chatProvider === ApiProvider.GEMINI) {
        resetGeminiChat(); 
    }
  }, [chatProvider, selectedGeminiModel]); // Add selectedGeminiModel

   useEffect(() => {
    // Clear OpenRouter history if provider or its specific model changes
    if (chatProvider === ApiProvider.OPENROUTER) {
        // No specific reset function like Gemini's, just clear history
    }
  }, [chatProvider, selectedOpenRouterModel]); // Add selectedOpenRouterModel

  useEffect(() => {
    if (researchTopic && apiKeys.semanticScholar && papers.length === 0 && totalPapers === 0 && !searchLoading) { 
        fetchPapersForPage(researchTopic, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchTopic, apiKeys.semanticScholar, currentPage]); 

  const canGenerateSections = ( 
      (new Set(selectedPaperIds).size > 0 || (papers.length > 0 && new Set(selectedPaperIds).size === 0 && cachedPapers.size > 0)) && 
      researchTopic !== '' && 
      isApiKeySet(generationProvider) &&
      (generationProvider === ApiProvider.GEMINI ? !!selectedGeminiModel : !!selectedOpenRouterModel) 
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-700 dark:text-primary-400">{APP_TITLE}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Search papers, generate sections, and chat with AI models of your choice.</p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ApiKeyManager apiKeys={apiKeys} onApiKeyChange={handleApiKeyChange} />
          <PaperSearchForm onSearch={handleSearch} loading={searchLoading || selectingAllPapersLoading} />
          { (papers.length > 0 || searchLoading || searchError || totalPapers > 0 || !!researchTopic ) &&
            <PaperListDisplay 
                papers={papers} 
                selectedPaperIds={new Set(selectedPaperIds)} 
                onToggleSelectPaper={toggleSelectPaper} 
                loading={searchLoading}
                error={searchError}
                currentPage={currentPage}
                totalPapers={totalPapers}
                papersPerPage={PAPERS_PER_PAGE}
                onPageChange={handlePageChange}
                researchTopicPresent={!!researchTopic}
                onSelectAllOnPage={handleSelectAllOnPage}
                onDeselectAll={handleDeselectAllPapers}
                onSelectAllAcrossPages={handleSelectAllAcrossPages}
                selectingAllPapersLoading={selectingAllPapersLoading}
                practicalSelectAllLimit={PRACTICAL_SELECT_ALL_LIMIT}
            />
          }
          <SectionGeneratorControls 
            onGenerateSection={handleGenerateSection}
            selectedProvider={generationProvider}
            onProviderChange={setGenerationProvider}
            loading={generationLoading}
            canGenerate={canGenerateSections}
            selectedGeminiModel={selectedGeminiModel}
            onGeminiModelChange={handleSelectedGeminiModelChange}
            availableGeminiModels={AVAILABLE_GEMINI_MODELS}
            selectedOpenRouterModel={selectedOpenRouterModel}
            onOpenRouterModelChange={handleSelectedOpenRouterModelChange}
            availableOpenRouterModels={AVAILABLE_OPENROUTER_MODELS}
            isApiKeyAvailable={isApiKeySet}
          />
          <GeneratedSectionDisplay title="Generated Introduction" content={introContent} loading={generationLoading && !introError && !introContent} error={introError} groundingSources={introGrounding} />
          <GeneratedSectionDisplay title="Generated Related Works" content={relatedWorksContent} loading={generationLoading && !relatedWorksError && !relatedWorksContent} error={relatedWorksError} groundingSources={relatedWorksGrounding} />
        </div>

        <div className="lg:col-span-1">
          <ChatWindow
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            loading={chatLoading}
            chatError={chatError}
            activeProvider={chatProvider}
            onProviderChange={(newProv) => {
              setChatProvider(newProv);
              // Clearing history when provider changes is handled by model change useEffects
            }}
            isApiKeySet={isApiKeySet}
            selectedGeminiModel={selectedGeminiModel}
            onGeminiModelChange={handleSelectedGeminiModelChange}
            availableGeminiModels={AVAILABLE_GEMINI_MODELS}
            selectedOpenRouterModel={selectedOpenRouterModel}
            onOpenRouterModelChange={handleSelectedOpenRouterModelChange}
            availableOpenRouterModels={AVAILABLE_OPENROUTER_MODELS}
          />
        </div>
      </div>
      <footer className="text-center mt-12 py-4 border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {APP_TITLE} | Ensure compliance with API provider terms of service. AI-generated content should be reviewed.
        </p>
      </footer>
    </div>
  );
};

export default App;
