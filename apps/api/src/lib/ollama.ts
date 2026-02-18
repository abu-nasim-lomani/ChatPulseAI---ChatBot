// Custom Ollama Client Wrapper
// This bypasses @langchain/community dependency issues

export class OllamaClient {
    private baseUrl: string;

    constructor(baseUrl: string = "http://localhost:11434") {
        this.baseUrl = baseUrl;
    }

    /**
     * Generate embeddings using Ollama
     */
    async embedQuery(text: string, model: string = "nomic-embed-text"): Promise<number[]> {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                prompt: text
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama embeddings failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.embedding;
    }

    /**
     * Generate chat completion using Ollama
     */
    async chat(messages: { role: string; content: string }[], model: string = "llama3.2"): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama chat failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message.content;
    }
}
