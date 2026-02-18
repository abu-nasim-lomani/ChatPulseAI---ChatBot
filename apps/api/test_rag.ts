
import { knowledgeService } from './src/services/KnowledgeService';
import dotenv from 'dotenv';

dotenv.config();

async function testAddKnowledge() {
    console.log("Starting RAG Test...");
    try {
        const result = await knowledgeService.addKnowledge(
            "test_tenant_1",
            "This is a test knowledge chunk to verify the RAG pipeline.",
            "test_script"
        );
        console.log("Success!", result);
    } catch (error) {
        console.error("Test Failed!", error);
    }
}

testAddKnowledge();
