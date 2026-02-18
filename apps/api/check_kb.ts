import prisma from './src/lib/prisma';

async function checkDB() {
    console.log("Checking Knowledge Chunks in Database...\n");

    const chunks = await prisma.knowledgeChunk.findMany({
        where: {
            tenantId: "6d643284-82c5-44e7-8dd5-8778386098b9"
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`Found ${chunks.length} knowledge chunks:\n`);

    chunks.forEach((chunk, index) => {
        console.log(`[${index + 1}] ID: ${chunk.id}`);
        console.log(`Source: ${chunk.source}`);
        console.log(`Content Preview: ${chunk.content.substring(0, 100)}...`);
        console.log(`Created: ${chunk.createdAt}`);
        console.log();
    });

    await prisma.$disconnect();
}

checkDB();
