/**
 * AI Provider Configuration
 * Supports: Ollama (local), OpenAI, Google Gemini
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { OllamaClient } from './ollama';

export type AIProvider = 'ollama' | 'openai' | 'gemini';

interface EmbeddingsInterface {
    embedQuery(text: string): Promise<number[]>;
}

interface ChatInterface {
    invoke(messages: any[]): Promise<{ content: string }>;
}

/**
 * Get Embeddings model based on provider
 */
export function getEmbeddings(provider?: AIProvider): EmbeddingsInterface {
    // Fallback to ollama if no provider specified or env not loaded
    const activeProvider = provider || (process.env.AI_PROVIDER as AIProvider) || 'ollama';

    console.log(`[AI Config] Using embeddings provider: ${activeProvider}`);

    switch (activeProvider) {
        case 'ollama': {
            const ollama = new OllamaClient("http://localhost:11434");
            return {
                embedQuery: async (text: string) => await ollama.embedQuery(text, "mxbai-embed-large")
            };
        }

        case 'openai':
            return new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: "text-embedding-3-small", // 1536d
            });

        case 'gemini':
            return new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GOOGLE_API_KEY,
                model: "models/gemini-embedding-001", // 3072d
                taskType: TaskType.RETRIEVAL_DOCUMENT,
            });

        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

/**
 * Get Chat model based on provider
 */
export function getChatModel(provider?: AIProvider): ChatInterface {
    // Fallback to ollama if no provider specified or env not loaded
    const activeProvider = provider || (process.env.AI_PROVIDER as AIProvider) || 'ollama';

    console.log(`[AI Config] Using chat provider: ${activeProvider}`);

    switch (activeProvider) {
        case 'ollama': {
            const ollama = new OllamaClient("http://localhost:11434");
            return {
                invoke: async (messages: any[]) => {
                    const formatted = messages.map((m: any) => ({
                        role: m.constructor.name === 'SystemMessage' ? 'system' : 'user',
                        content: m.content as string
                    }));
                    const response = await ollama.chat(formatted, "llama3.2");
                    return { content: response };
                }
            };
        }

        case 'openai': {
            const chat = new ChatOpenAI({
                modelName: "gpt-4o-mini",
                temperature: 0.7,
                openAIApiKey: process.env.OPENAI_API_KEY,
            });
            return {
                invoke: async (messages: any[]) => {
                    const result = await chat.invoke(messages);
                    return { content: result.content as string };
                }
            };
        }

        case 'gemini': {
            const chat = new ChatGoogleGenerativeAI({
                model: "gemini-1.5-flash",
                maxOutputTokens: 2048,
                apiKey: process.env.GOOGLE_API_KEY,
            });
            return {
                invoke: async (messages: any[]) => {
                    const result = await chat.invoke(messages);
                    return { content: result.content as string };
                }
            };
        }

        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

/**
 * Get vector dimensions for Pinecone index based on provider
 */
export function getVectorDimensions(provider: AIProvider): number {
    switch (provider) {
        case 'ollama': return 1024;   // mxbai-embed-large is 1024d
        case 'openai': return 1536;  // text-embedding-3-small
        case 'gemini': return 3072;  // gemini-embedding-001
        default: return 1024;
    }
}
