const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    console.log("Checking DB for fallback messages...");

    // Check config first
    const tenantId = "5821bd7d-fc5f-4e58-83ba-bd7436cea13b";
    const tenant = await p.tenant.findUnique({
        where: { id: tenantId },
        select: { chatConfig: true }
    });
    console.log("Tenant Chat Config:");
    console.dir(tenant?.chatConfig, { depth: null });

    const expectedFallback = "I don't have that information right now. Would you like to speak with a human agent?";

    // Check messages
    const msgs = await p.chatMessage.findMany({
        where: {
            session: { tenantId },
            role: 'assistant',
            content: { contains: "information right now" }
        },
        select: { id: true, content: true, createdAt: true, sessionId: true }
    });

    console.log(`Found ${msgs.length} potential fallback messages.`);
    if (msgs.length > 0) {
        console.log("First message content exact match status:", msgs[0].content === expectedFallback);
        console.log("DB content:", msgs[0].content);
        console.log("Expected content:", expectedFallback);
    }

    await p.$disconnect();
}
main().catch(console.error);
