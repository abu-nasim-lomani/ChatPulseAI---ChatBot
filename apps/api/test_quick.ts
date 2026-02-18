import { OllamaClient } from "./src/lib/ollama";

async function quickTest() {
    console.log("🧪 Quick Ollama Test\n");

    const ollama = new OllamaClient("http://localhost:11434");

    try {
        console.log("1️⃣ Testing Embeddings...");
        const vector = await ollama.embedQuery("Hello world", "nomic-embed-text");
        console.log(`✅ Embeddings OK! Vector size: ${vector.length}\n`);

        console.log("2️⃣ Testing Chat...");
        const response = await ollama.chat([
            { role: "user", content: "Say 'Hello from Ollama!' in one sentence" }
        ], "llama3.2");
        console.log(`✅ Chat OK! Response: ${response}\n`);

        console.log("🎉 All tests passed! System ready!");
    } catch (error: any) {
        console.error("❌ Test failed:", error.message);
    }
}

quickTest();
