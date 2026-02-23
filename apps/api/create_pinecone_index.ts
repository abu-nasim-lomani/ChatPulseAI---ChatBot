import { Pinecone } from '@pinecone-database/pinecone';
import { getVectorDimensions } from './src/lib/ai-config';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Initializing Pinecone Client...');
    const PINECONE_KEY = process.env.PINECONE_API_KEY || 'pcsk_6YrQCf_Q9YA71Py6iLXMKRiufRsMLLFhPbSdRP5nj4tt1oBJsN8QWG4vKPYcyT9QZcFqPT';
    const pinecone = new Pinecone({
        apiKey: PINECONE_KEY,
    });

    const indexName = 'chatbot-saas';
    const dimension = getVectorDimensions();

    console.log(`Using Fixed Embedding AI Provider: OpenAI (text-embedding-3-small)`);
    console.log(`Vector Dimensions: ${dimension}`);

    // 1. Delete existing index if it exists
    console.log('Checking for existing Pinecone index...');
    const indexList = await pinecone.listIndexes();
    const existingIndex = indexList.indexes?.find(i => i.name === indexName);

    if (existingIndex) {
        console.log(`Deleting existing index "${indexName}"...`);
        await pinecone.deleteIndex(indexName);
        console.log('Waiting 10 seconds for deletion to propagate...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
        console.log(`No existing index named "${indexName}" found.`);
    }

    // 2. Create new index
    try {
        console.log(`\nCreating index "${indexName}" with dimension ${dimension}...`);
        await pinecone.createIndex({
            name: indexName,
            dimension: dimension, // Statically set to 1536 from AI_CONFIG
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });
        console.log('✅ Index created successfully!');
    } catch (error) {
        console.error('❌ Failed to create index:', error);
    }
}

main().catch(console.error);
