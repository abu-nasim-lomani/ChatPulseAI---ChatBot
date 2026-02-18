
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testAllModels() {
    console.log("Testing Multiple Embedding Models...");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

    const models = [
        "text-embedding-004",
        "models/text-embedding-004",
        "embedding-001",
        "models/embedding-001",
        "gemini-1.5-flash",
        "models/gemini-1.5-flash"
    ];

    for (const modelName of models) {
        console.log(`\nTesting model: "${modelName}"...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.embedContent("test");
            console.log(`✅ SUCCESS! "${modelName}" works. Vector length: ${result.embedding.values.length}`);
        } catch (error: any) {
            console.log(`❌ FAILED "${modelName}":`, error.message);
        }
    }
}

testAllModels();
