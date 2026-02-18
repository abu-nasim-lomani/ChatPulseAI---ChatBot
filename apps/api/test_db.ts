import prisma from './src/lib/prisma';

async function testDB() {
    console.log("Testing Database Connection...\n");

    try {
        console.log("1. Attempting to connect to PostgreSQL...");
        await prisma.$connect();
        console.log("✅ Database connected successfully!\n");

        console.log("2. Testing query - Fetching tenants...");
        const tenants = await prisma.tenant.findMany({ take: 5 });
        console.log(`✅ Found ${tenants.length} tenant(s)`);

        if (tenants.length > 0) {
            console.log("First tenant:", tenants[0]);
        }

        console.log("\n3. Checking KnowledgeChunk table...");
        const chunks = await prisma.knowledgeChunk.findMany({ take: 1 });
        console.log(`✅ KnowledgeChunk table exists. Found ${chunks.length} chunk(s)\n`);

        console.log("✅ All database tests passed!");

    } catch (error: any) {
        console.error("\n❌ DATABASE ERROR:");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Stack:", error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testDB();
