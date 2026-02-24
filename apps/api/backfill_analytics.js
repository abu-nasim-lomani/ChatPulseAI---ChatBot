const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting analytics backfill...");

    // 1. Update KnowledgeChunks
    const chunks = await prisma.knowledgeChunk.findMany();
    let updatedChunks = 0;
    for (const chunk of chunks) {
        if (!chunk.byteSize || chunk.byteSize === 0) {
            const size = Buffer.byteLength(chunk.content || '', 'utf8');
            await prisma.knowledgeChunk.update({
                where: { id: chunk.id },
                data: { byteSize: size }
            });
            updatedChunks++;
        }
    }
    console.log(`Updated ${updatedChunks} knowledge chunks with byteSize.`);

    // 2. Update ChatMessages
    const messages = await prisma.chatMessage.findMany();
    let updatedMsgs = 0;
    for (const msg of messages) {
        if (!msg.tokensUsed || msg.tokensUsed === 0) {
            // Rough approximation: 1 token ~= 4 chars (standard rule of thumb)
            const tokens = Math.ceil((msg.content || '').length / 4);
            await prisma.chatMessage.update({
                where: { id: msg.id },
                data: { tokensUsed: tokens }
            });
            updatedMsgs++;
        }
    }
    console.log(`Updated ${updatedMsgs} messages with token estimates.`);

    console.log("Backfill complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
