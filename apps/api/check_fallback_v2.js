const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const tid = "6114e75e-5fe1-4d15-b7d9-349b27b4a4a1";

    // What is this tenant's fallback message?
    const t = await p.tenant.findUnique({ where: { id: tid }, select: { chatConfig: true } });
    console.log("Tenant fallback:", t?.chatConfig?.fallbackMessage);

    const msgs = await p.chatMessage.findMany({
        where: { session: { tenantId: tid } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.dir(msgs, { depth: null });
    await p.$disconnect();
}
main().catch(console.error);
