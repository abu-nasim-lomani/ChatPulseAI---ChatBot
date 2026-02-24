import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
    const msgs = await prisma.chatMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { session: { include: { endUser: true } } }
    });
    console.log(JSON.stringify(msgs, null, 2));
}
check();
