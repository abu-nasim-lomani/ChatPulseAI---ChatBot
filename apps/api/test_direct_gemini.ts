
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testDirectEmbedding() {
    console.log("Testing Direct Google GenAI SDK...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const text = "This is a test sentence.";
        console.log(`Embedding text: "${text}"`);

        const result = await model.embedContent(text);
        const vector = result.embedding.values;

        console.log("Success! Vector length:", vector.length);
    } catch (error) {
        console.error("Direct SDK Failed:", error);
    }
}

testDirectEmbedding();
