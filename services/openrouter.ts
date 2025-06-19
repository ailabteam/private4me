
import { OPENROUTER_DEFAULT_MODEL } from '../constants';

// Simplified OpenRouter interaction - assumes Chat Completions API structure like OpenAI's
// For a real app, you might want more robust error handling and model selection.

export interface OpenRouterMessage { // Exporting for use in App.tsx state
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }[];
  // ... other fields
}

export async function generateTextWithOpenRouter(
  apiKey: string,
  prompt: string,
  model: string = OPENROUTER_DEFAULT_MODEL, // Model parameter is used here
  systemInstruction?: string,
  history?: OpenRouterMessage[] 
): Promise<string> {
  if (!apiKey) {
    throw new Error("OpenRouter API key is not set.");
  }

  const messages: OpenRouterMessage[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  if (history) {
    messages.push(...history);
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model, // Ensure the selected model is passed to the API
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as OpenRouterChatCompletionResponse;
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error("OpenRouter returned no choices or an unexpected response format.");
    }
  } catch (error: any) {
    console.error("OpenRouter API error:", error);
    throw new Error(`OpenRouter API error: ${error.message || 'Unknown error'}`);
  }
}

// OpenRouter chat function (can use the same generateTextWithOpenRouter with history)
export async function chatWithOpenRouter(
  apiKey: string,
  userMessage: string,
  currentHistory: OpenRouterMessage[], 
  model: string = OPENROUTER_DEFAULT_MODEL, // Model parameter is used here
  systemInstruction?: string
): Promise<{ text: string; updatedHistory: OpenRouterMessage[] }> {
  
  const messagesForApi: OpenRouterMessage[] = [];
   if (systemInstruction && !currentHistory.find(m => m.role === 'system')) {
    messagesForApi.push({ role: 'system', content: systemInstruction });
  }
  messagesForApi.push(...currentHistory); // Add existing history
  messagesForApi.push({ role: 'user', content: userMessage });


  // Call generateTextWithOpenRouter, ensuring systemInstruction is not duplicated if already in history
  const aiResponseText = await generateTextWithOpenRouter(
      apiKey, 
      userMessage, // prompt is just the user message for chat turn
      model, 
      undefined, // systemInstruction is already part of messagesForApi if provided
      currentHistory // Pass the history correctly
    );


  const updatedHistoryAfterUser: OpenRouterMessage[] = [
    ...messagesForApi, // This already includes the new user message
  ];
  const finalHistory: OpenRouterMessage[] = [
    ...updatedHistoryAfterUser,
    { role: 'assistant', content: aiResponseText },
  ];
  
  return { text: aiResponseText, updatedHistory: finalHistory };
}
