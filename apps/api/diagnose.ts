
import dotenv from 'dotenv';
import path from 'path';
// Load env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { PrismaClient } from '@prisma/client';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddings } from './src/lib/ai-config';

async function diagnose() {
    console.log("🔍 Starting Backend Diagnosis...\n");

    // 1. Check Environment Variables
    console.log("1️⃣ Checking Environment Variables:");
    const requiredVars = ['DATABASE_URL', 'PINECONE_API_KEY', 'AI_PROVIDER'];
    let envOk = true;
    requiredVars.forEach(v => {
        if (process.env[v]) {
            console.log(`   ✅ ${v} is set`);
        } else {
            console.error(`   ❌ ${v} is MISSING`);
            envOk = false;
        }
    });

    if (!process.env.OPENAI_API_KEY && process.env.AI_PROVIDER === 'openai') {
        console.error(`   ❌ OPENAI_API_KEY is MISSING but provider is 'openai'`);
        envOk = false;
    }

    console.log(`   ℹ️ AI_PROVIDER: ${process.env.AI_PROVIDER}`);
    console.log(`   ℹ️ EMBEDDING_PROVIDER: ${process.env.EMBEDDING_PROVIDER || process.env.AI_PROVIDER || 'ollama'}`);

    // 2. Test Prisma (Database)
    console.log("\n2️⃣ Testing Database Connection (Prisma):");
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log("   ✅ Database connected successfully!");
        const tenantCount = await prisma.uIConfig.count().catch(() => 0); // Just a simple query
        console.log("   ℹ️ Database looks responsive.");
    } catch (e: any) {
        console.error("   ❌ Database Connection FAILED:", e.message);
    } finally {
        await prisma.$disconnect();
    }

    // 3. Test Embedding Provider (Ollama/OpenAI)
    console.log("\n3️⃣ Testing Embedding Generation:");
    try {
        const provider = (process.env.EMBEDDING_PROVIDER || process.env.AI_PROVIDER || 'ollama') as any;
        console.log(`   ℹ️ Testing provider: ${provider}`);
        const embeddings = getEmbeddings(provider);
        console.log("   ℹ️ Generating test embedding...");
        const vector = await embeddings.embedQuery("Hello world");
        if (vector && vector.length > 0) {
            console.log(`   ✅ Embedding generated! Vector length: ${vector.length}`);
        } else {
            console.error("   ❌ Embedding returned empty result.");
        }
    } catch (e: any) {
        console.error("   ❌ Embedding Generation FAILED:", e.message);
        if (e.message.includes("fetch failed") && process.env.AI_PROVIDER === 'ollama') {
            console.error("      💡 HINT: Is Ollama running? Run 'ollama serve' in a separate terminal.");
        }
    }

    // 4. Test Pinecone
    console.log("\n4️⃣ Testing Pinecone Connection:");
    try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        const indexName = "chatbot-saas";
        console.log(`   ℹ️ Checking index: ${indexName}`);

        const description = await pc.describeIndex(indexName);
        console.log(`   ✅ Pinecone Index Found! Status: ${description.status.state}`);
        console.log(`      Host: ${description.host}`);

        // Check dimension mismatch
        const vectorDim = (process.env.EMBEDDING_PROVIDER === 'openai' || process.env.AI_PROVIDER === 'openai') ? 1536 : 1024;
        if (description.dimension && description.dimension !== vectorDim) {
            console.warn(`   ⚠️ WARNING: Dimension Mismatch! Index: ${description.dimension}, App Config: ${vectorDim}`);
        }

    } catch (e: any) {
        console.error("   ❌ Pinecone Connection FAILED:", e.message);
    }

    console.log("\n🏁 Diagnosis Complete.");
}

diagnose();
