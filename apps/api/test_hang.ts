
async function test() {
    console.log("🚀 Testing Imports...");

    try {
        console.log("1. Importing @langchain/openai...");
        await import("@langchain/openai");
        console.log("   ✅ @langchain/openai Verified");
    } catch (e) {
        console.error("   ❌ @langchain/openai Failed:", e);
    }

    try {
        console.log("2. Importing @langchain/google-genai...");
        await import("@langchain/google-genai");
        console.log("   ✅ @langchain/google-genai Verified");
    } catch (e) {
        console.error("   ❌ @langchain/google-genai Failed:", e);
    }

    try {
        console.log("3. Importing @pinecone-database/pinecone...");
        await import("@pinecone-database/pinecone");
        console.log("   ✅ Pinecone Verified");
    } catch (e) {
        console.error("   ❌ Pinecone Failed:", e);
    }

    console.log("🏁 Import Test Complete");
}

test();
