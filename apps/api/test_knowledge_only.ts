
console.log("Start test_knowledge_only.ts");
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log("Dotenv loaded");

import { knowledgeService } from './src/services/KnowledgeService';
console.log("KnowledgeService imported");

async function test() {
    console.log("Testing KnowledgeService.addKnowledge...");
    try {
        const result = await knowledgeService.addKnowledge("test-tenant", "Hello world", "manual", "text", {});
        console.log("Success:", result);
    } catch (e: any) {
        console.error("Error:", e);
    }
}

test();
