import { knowledgeService } from './src/services/KnowledgeService';

async function testQuery() {
    console.log("Testing Knowledge Query...\n");

    const tenantId = "6d643284-82c5-44e7-8dd5-8778386098b9";
    const query = "What are your business hours?";

    try {
        console.log(`Query: "${query}"`);
        console.log(`Tenant ID: ${tenantId}\n`);

        const results = await knowledgeService.queryKnowledge(tenantId, query);

        console.log(`✅ Found ${results.length} matching chunks:\n`);
        results.forEach((chunk, index) => {
            console.log(`--- Result ${index + 1} ---`);
            console.log(chunk);
            console.log();
        });

        if (results.length === 0) {
            console.log("❌ NO RESULTS FOUND - This is the problem!");
            console.log("Possible issues:");
            console.log("1. Knowledge not properly indexed in Pinecone");
            console.log("2. Embeddings not matching");
            console.log("3. Tenant ID mismatch in metadata");
        }

    } catch (error: any) {
        console.error("❌ Error querying knowledge:");
        console.error(error.message);
        console.error(error.stack);
    }
}

testQuery();
