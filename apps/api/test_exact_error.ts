import { knowledgeService } from './src/services/KnowledgeService';

async function testDirectly() {
    console.log("=".repeat(60));
    console.log("TESTING KNOWLEDGE SERVICE DIRECTLY");
    console.log("=".repeat(60));

    try {
        console.log("\n1. Calling addKnowledge with:");
        console.log("   - tenantId: test-tenant-123");
        console.log("   - content: This is test content");
        console.log("   - source: manual\n");

        const result = await knowledgeService.addKnowledge(
            "6d643284-82c5-44e7-8dd5-8778386098b9",
            "This is test content for debugging the 500 error",
            "manual"
        );

        console.log("\n✅ SUCCESS! Result:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.log("\n" + "=".repeat(60));
        console.log("❌ ERROR CAUGHT - THIS IS THE EXACT PROBLEM:");
        console.log("=".repeat(60));
        console.log("\nError Name:", error.name);
        console.log("\nError Message:", error.message);
        console.log("\nError Code:", error.code);
        console.log("\nFull Stack Trace:");
        console.log(error.stack);
        console.log("\n" + "=".repeat(60));

        if (error.cause) {
            console.log("\nUnderlying Cause:");
            console.log(error.cause);
        }
    }
}

testDirectly();
