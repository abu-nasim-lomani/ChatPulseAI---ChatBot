import prisma from './src/lib/prisma';

async function listTenants() {
    const tenants = await prisma.tenant.findMany();
    console.log("Tenants found:", tenants);
}

listTenants();
