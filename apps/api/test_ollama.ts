import { OllamaClient } from './src/lib/ollama';

async function testOllama() {
    console.log("Testing Custom Ollama Integration...\n");

    const ollama = new OllamaClient("http://localhost:11434");

    // 1. Test Embeddings
    console.log("1. Testing Ollama Embeddings (nomic-embed-text)...");
    try {
        const vector = await ollama.embedQuery("test query", "nomic-embed-text");
        console.log(`✅ Embeddings work! Vector length: ${vector.length}`);
    } catch (error: any) {
        console.error(`❌ Embeddings failed:`, error.message);
        console.error("Make sure you ran: ollama pull nomic-embed-text");
    }

    // 2. Test Chat
    console.log("\n2. Testing Ollama Chat (llama3.2)...");
    try {
        const response = await ollama.chat([
            { role: "user", content: "Say hello in Bengali in one sentence" }
        ], "llama3.2");
        console.log(`✅ Chat works! Response: ${response}`);
    } catch (error: any) {
        console.error(`❌ Chat failed:`, error.message);
        console.error("Make sure you ran: ollama pull llama3.2");
    }
}

testOllama();
