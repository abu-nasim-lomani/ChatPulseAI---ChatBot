const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const users = await prisma.endUser.findMany({
        select: {
            externalId: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    });
    console.log(JSON.stringify(users, null, 2));
}

run().finally(() => prisma.$disconnect());
