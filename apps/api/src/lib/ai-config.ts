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
 * Get Embeddings model (Fixed to OpenAI text-embedding-3-small for Hybrid Architecture)
 */
export function getEmbeddings(): EmbeddingsInterface {
    console.log(`[AI Config] Using fixed embeddings provider: openai (text-embedding-3-small)`);
    return new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small", // 1536d
    });
}

export interface ChatConfig {
    provider: AIProvider;
    model?: string;
    apiKey?: string;
}

/**
 * Get Chat model based on dynamic tenant config
 */
export function getChatModel(config?: ChatConfig): ChatInterface {
    // Fallback if no config is provided
    const activeProvider = config?.provider || (process.env.AI_PROVIDER as AIProvider) || 'ollama';

    console.log(`[AI Config] Using chat provider: ${activeProvider}`);

    switch (activeProvider) {
        case 'ollama': {
            const ollamaModel = config?.model || "llama3.2";
            const ollama = new OllamaClient("http://localhost:11434");
            return {
                invoke: async (messages: any[]) => {
                    const formatted = messages.map((m: any) => ({
                        role: m.constructor.name === 'SystemMessage' ? 'system' : 'user',
                        content: m.content as string
                    }));
                    const response = await ollama.chat(formatted, ollamaModel);
                    return { content: response };
                }
            };
        }

        case 'openai': {
            const chat = new ChatOpenAI({
                modelName: config?.model || "gpt-4o-mini",
                temperature: 0.7,
                openAIApiKey: config?.apiKey || process.env.OPENAI_API_KEY,
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
                model: config?.model || "gemini-1.5-flash",
                maxOutputTokens: 2048,
                apiKey: config?.apiKey || process.env.GOOGLE_API_KEY,
            });
            return {
                invoke: async (messages: any[]) => {
                    const result = await chat.invoke(messages);
                    return { content: result.content as string };
                }
            };
        }

        default:
            throw new Error(`Unknown AI provider: ${activeProvider}`);
    }
}

/**
 * Get vector dimensions for Pinecone index (Fixed to OpenAI dimensions)
 */
export function getVectorDimensions(): number {
    return 1536; // text-embedding-3-small
}
