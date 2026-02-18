import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testOpenAI() {
    console.log("Testing OpenAI Integration...\n");

    // 1. Test Embeddings
    console.log("1. Testing OpenAI Embeddings...");
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-3-small",
        });

        const vector = await embeddings.embedQuery("test query");
        console.log(`✅ Embeddings work! Vector length: ${vector.length}`);
    } catch (error: any) {
        console.error(`❌ Embeddings failed:`, error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }

    // 2. Test Chat
    console.log("\n2. Testing OpenAI Chat...");
    try {
        const chatModel = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const response = await chatModel.invoke("Say hello");
        console.log(`✅ Chat works! Response: ${response.content}`);
    } catch (error: any) {
        console.error(`❌ Chat failed:`, error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testOpenAI();
