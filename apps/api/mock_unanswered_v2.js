const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const fallbackMsg = "I'm sorry, I don't have information on that. Would you like to speak with a human agent?";
    const tid = "6114e75e-5fe1-4d15-b7d9-349b27b4a4a1"; // Current logged in tenant on dashboard

    // Find an existing session
    const s = await p.chatSession.findFirst({ where: { tenantId: tid } });
    if (!s) return console.log("No session found for tenant", tid);

    // Insert dummy user questions and fallback responses
    const mockData = [
        "How much does shipping to Pluto cost?",
        "Can I get a discount if I buy 100?",
        "What is the CEO's favorite color?",
        "Do you have a physical store in Dhaka?",
        "How much does shipping to Pluto cost?", // repeated to increase count
        "How much does shipping to Pluto cost?", // repeated
        "Can I get a discount if I buy 100?"    // repeated
    ];

    for (const question of mockData) {
        // Insert user message
        const um = await p.chatMessage.create({
            data: {
                sessionId: s.id,
                role: 'user',
                content: question,
                createdAt: new Date()
            }
        });

        // Insert fallback assistant message 1 second later
        await p.chatMessage.create({
            data: {
                sessionId: s.id,
                role: 'assistant',
                content: fallbackMsg,
                createdAt: new Date(Date.now() + 1000)
            }
        });
    }

    console.log("Mock unanswered questions inserted for active tenant:", tid);
    await p.$disconnect();
}
main().catch(console.error);
