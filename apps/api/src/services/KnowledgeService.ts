import prisma from '../lib/prisma';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddings, AIProvider } from '../lib/ai-config';

// Fallback for Pinecone API key if env doesn't load
const PINECONE_KEY = process.env.PINECONE_API_KEY || 'pcsk_6YrQCf_Q9YA71Py6iLXMKRiufRsMLLFhPbSdRP5nj4tt1oBJsN8QWG4vKPYcyT9QZcFqPT';

const pinecone = new Pinecone({
    apiKey: PINECONE_KEY
});

// Get provider from env (default: ollama)
const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama') as AIProvider;
const embeddings = getEmbeddings(AI_PROVIDER);

export class KnowledgeService {
    private indexName = "chatbot-saas"; // Ensure this index exists in Pinecone

    // Helper: Split text into chunks with overlap
    private splitIntoChunks(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
        if (text.length <= chunkSize) return [text];

        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < text.length) {
            let endIndex = startIndex + chunkSize;

            if (endIndex < text.length) {
                // Try to break at a sentence or space to avoid cutting words
                const lastPeriod = text.lastIndexOf('.', endIndex);
                const lastSpace = text.lastIndexOf(' ', endIndex);

                if (lastPeriod > startIndex + chunkSize * 0.5) {
                    endIndex = lastPeriod + 1;
                } else if (lastSpace > startIndex + chunkSize * 0.5) {
                    endIndex = lastSpace;
                }
            }

            const chunk = text.slice(startIndex, endIndex).trim();
            if (chunk.length > 0) chunks.push(chunk);

            startIndex = endIndex - overlap;
            if (startIndex < 0) startIndex = 0; // Integrity check
            // Avoid infinite loop if no progress
            if (startIndex >= endIndex) startIndex = endIndex;
        }

        return chunks;
    }

    async addKnowledge(tenantId: string, content: string, source: string = "manual") {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`[KnowledgeService] Adding knowledge for tenant ${tenantId}`);
        console.log(`[KnowledgeService] Content length: ${content.length} chars`);

        const index = pinecone.index(this.indexName);
        const chunks = this.splitIntoChunks(content);
        console.log(`[KnowledgeService] Split into ${chunks.length} chunks`);

        try {
            const results = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                console.log(`[Chunk ${i + 1}/${chunks.length}] Processing (${chunkText.length} chars)...`);

                // 1. Generate Embedding
                const vector = await embeddings.embedQuery(chunkText);

                // 2. Save to Postgres
                const dbChunk = await prisma.knowledgeChunk.create({
                    data: {
                        tenantId,
                        content: chunkText,
                        source,
                        vectorId: ""
                    }
                });

                // 3. Upload to Pinecone
                await index.upsert({
                    records: [{
                        id: dbChunk.id,
                        values: vector,
                        metadata: {
                            tenantId,
                            content: chunkText,
                            source: source || 'unknown',
                            originalId: content.substring(0, 20) // grouping ID
                        }
                    }]
                });

                // 4. Update DB
                await prisma.knowledgeChunk.update({
                    where: { id: dbChunk.id },
                    data: { vectorId: dbChunk.id }
                });

                results.push(dbChunk);
            }

            console.log(`✅ Successfully added ${results.length} chunks!`);
            return results[0]; // Return first chunk as ref

        } catch (error: any) {
            console.error(`❌ ERROR IN KNOWLEDGE SERVICE:`, error);
            throw error;
        }
    }

    async queryKnowledge(tenantId: string, query: string, topK: number = 3) {
        const index = pinecone.index(this.indexName);

        // 1. Generate Query Embedding
        const queryVector = await embeddings.embedQuery(query);

        // 2. Query Pinecone
        const results = await index.query({
            vector: queryVector,
            topK,
            filter: { tenantId: { $eq: tenantId } },
            includeMetadata: true
        });

        // 3. Extract Text
        return results.matches.map(match => match.metadata?.content as string).filter(Boolean);
    }
}

export const knowledgeService = new KnowledgeService();
