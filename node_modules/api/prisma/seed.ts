import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo-store' },
        update: {},
        create: {
            name: 'Demo Store',
            slug: 'demo-store',
            apiKey: 'demo_tenant_123',
        },
    });

    console.log({ tenant });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
