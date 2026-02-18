import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { getVectorDimensions, AIProvider } from './src/lib/ai-config';

dotenv.config({ path: '.env' });

async function createIndex() {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!
    });

    const indexName = 'chatbot-saas';
    const provider = (process.env.AI_PROVIDER || 'ollama') as AIProvider;
    const dimension = getVectorDimensions(provider);

    console.log(`Using AI Provider: ${provider}`);
    console.log(`Vector Dimensions: ${dimension}`);

    // 1. Delete existing index if it exists
    try {
        console.log(`\nChecking if index "${indexName}" exists...`);
        await pinecone.deleteIndex(indexName);
        console.log(`Deleted existing index "${indexName}". Waiting for deletion to propagate...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error: any) {
        if (error.message && error.message.includes('404')) {
            console.log(`Index "${indexName}" did not exist, proceeding to create.`);
        } else {
            console.log(`Error deleting index (might not exist):`, error.message);
        }
    }

    // 2. Create new index
    try {
        console.log(`\nCreating index "${indexName}" with dimension ${dimension}...`);
        await pinecone.createIndex({
            name: indexName,
            dimension: dimension, // Auto-detected from AI_PROVIDER
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });
        console.log(`✅ Index "${indexName}" created successfully!`);
    } catch (error) {
        console.error('❌ Error creating index:', error);
    }
}

createIndex();
