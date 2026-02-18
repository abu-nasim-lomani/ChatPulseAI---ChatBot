import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function checkIndex() {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!
    });

    try {
        const indexName = 'chatbot-saas';
        const description = await pinecone.describeIndex(indexName);
        console.log('Index Description:', description);
    } catch (error) {
        console.error('Error checking index:', error);
    }
}

checkIndex();
