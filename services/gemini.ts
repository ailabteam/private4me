
import { GoogleGenAI, GenerateContentResponse, Chat, Part, Content, GenerateContentParameters } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants'; // Default model
import { GroundingChunk } from "../types";

let ai: GoogleGenAI | null = null;
let activeApiKey: string | null = null;

function getAi(apiKey: string): GoogleGenAI {
  if (ai && activeApiKey === apiKey) {
    return ai;
  }
  if (!apiKey) {
    throw new Error("Gemini API key is not set.");
  }
  // Correct initialization: use named parameter {apiKey: ...}
  ai = new GoogleGenAI({ apiKey });
  activeApiKey = apiKey;
  return ai;
}

export interface GeminiGenerateTextResult {
  text: string;
  groundingChunks?: GroundingChunk[];
}


export async function generateTextWithGemini(
  apiKey: string, 
  prompt: string, 
  model: string = GEMINI_TEXT_MODEL, // Accept model parameter
  systemInstruction?: string,
  useSearchGrounding: boolean = false
): Promise<GeminiGenerateTextResult> {
  const currentAi = getAi(apiKey);
  
  const request: GenerateContentParameters = { // Corrected type
    model: model, // Use provided model
    contents: [{ role: "user", parts: [{text: prompt}] }],
    config: {},
  };

  if (request.config && systemInstruction) {
    request.config.systemInstruction = systemInstruction;
  }

  if (useSearchGrounding && request.config) {
     request.config.tools = [{googleSearch: {}}];
     // responseMimeType: "application/json" is not supported with googleSearch tool
  }


  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent(request);
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    return {
      text: response.text,
      groundingChunks: groundingMetadata?.groundingChunks as GroundingChunk[] || undefined
    };
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

let geminiChatInstance: Chat | null = null;
let chatApiKey: string | null = null;
let chatSystemInstruction: string | null = null;
let chatModelUsed: string | null = null; // Track model used for chat

export async function startOrContinueChatWithGemini(
  apiKey: string,
  userMessage: string,
  history: Content[], 
  model: string = GEMINI_TEXT_MODEL, // Accept model parameter
  systemInstruction?: string
): Promise<{ text: string; updatedHistory: Content[] }> {
  const currentAi = getAi(apiKey);

  if (!geminiChatInstance || chatApiKey !== apiKey || chatSystemInstruction !== systemInstruction || chatModelUsed !== model) {
    geminiChatInstance = currentAi.chats.create({
      model: model, // Use provided model
      history: history, // Initialize with current history if any
      config: systemInstruction ? { systemInstruction: systemInstruction } : {},
    });
    chatApiKey = apiKey;
    chatSystemInstruction = systemInstruction;
    chatModelUsed = model; // Store the model used for this instance
  }
  
  try {
    // If history was passed to create, and the instance is fresh, sending message without history should be fine.
    // However, the SDK examples sometimes show sending history with each message to a fresh chat.
    // For a persistent `geminiChatInstance`, just sending the message should suffice.
    const response: GenerateContentResponse = await geminiChatInstance.sendMessage({message: userMessage});
    const aiResponseText = response.text;

    // The SDK's chat instance should internally manage its history.
    // We construct `updatedHistory` for the app's state, not necessarily to re-initialize the chat instance *every* time,
    // unless the model/API key/system instruction changes.
    const updatedHistory: Content[] = [
      ...history, // This is the history *before* this turn
      { role: "user", parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text: aiResponseText }] },
    ];
    
    // To ensure the instance is robust for the *next* call, especially if it doesn't perfectly maintain state as expected,
    // or if we want to be absolutely sure after model/config changes:
    // We could re-initialize here IF a new model/config was just set, but the check above should handle it.
    // For now, assume the instance updates its history. If issues arise, we can re-create with updatedHistory.

    return { text: aiResponseText, updatedHistory };
  } catch (error: any) {
    console.error("Gemini Chat API error:", error);
    if (error.message && error.message.includes("API key not valid")) {
        ai = null; 
        activeApiKey = null;
        geminiChatInstance = null;
        chatApiKey = null;
        chatModelUsed = null;
    }
    throw new Error(`Gemini Chat API error: ${error.message || 'Unknown error'}`);
  }
}

export function resetGeminiChat() {
  geminiChatInstance = null;
  chatApiKey = null;
  chatSystemInstruction = null;
  chatModelUsed = null; // Also reset the model used
}