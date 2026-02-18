// Direct test of knowledge service to see actual error
import { knowledgeService } from './src/services/KnowledgeService.js';

async function testDirectly() {
    console.log("Testing KnowledgeService directly...\n");

    try {
        const result = await knowledgeService.addKnowledge(
            "test-tenant-123",
            "This is test content for debugging",
            "manual"
        );
        console.log("✅ SUCCESS:", result);
    } catch (error) {
        console.error("❌ EXACT ERROR:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Full error:", error);
    }
}

testDirectly();
