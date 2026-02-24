const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const fallbackMsg = "I don't have that information right now. Would you like to speak with a human agent?";
    const tid = "5821bd7d-fc5f-4e58-83ba-bd7436cea13b"; // Demo Store

    // Find an existing session
    const s = await p.chatSession.findFirst({ where: { tenantId: tid } });
    if (!s) return console.log("No session found");

    // Insert dummy user message
    const um = await p.chatMessage.create({
        data: {
            sessionId: s.id,
            role: 'user',
            content: 'How much does shipping to Pluto cost?'
        }
    });

    // Insert fallback assistant message right after
    await p.chatMessage.create({
        data: {
            sessionId: s.id,
            role: 'assistant',
            content: fallbackMsg
        }
    });

    console.log("Mock unanswered question inserted for Pluto shipping!");
    await p.$disconnect();
}
main().catch(console.error);
