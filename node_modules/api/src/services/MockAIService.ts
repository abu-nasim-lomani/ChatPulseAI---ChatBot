export class MockAIService {
    static async generateResponse(prompt: string): Promise<string> {
        // Simulate typing delay (1-2 seconds)
        const delay = Math.floor(Math.random() * 1000) + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        const lowerPrompt = prompt.toLowerCase();

        // Keyword Matching Logic
        if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
            return "Hello! Welcome to our store. How can I help you today?";
        }

        if (lowerPrompt.includes('price') || lowerPrompt.includes('cost')) {
            return "Our basic plan starts at $10/month. The Pro plan is $29/month.";
        }

        if (lowerPrompt.includes('help') || lowerPrompt.includes('support')) {
            return "Sure, I can help! You can ask me about prices, features, or contact info.";
        }

        if (lowerPrompt.includes('contact') || lowerPrompt.includes('email')) {
            return "You can reach our support team at support@example.com.";
        }

        // Default Fallback
        return "I'm not sure about that. Can you please ask something else? (Try asking about 'price' or 'help')";
    }
}
