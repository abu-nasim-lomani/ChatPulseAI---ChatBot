import prisma from './src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    try {
        const tenantId = uuidv4();
        const apiKey = uuidv4();

        const tenant = await prisma.tenant.create({
            data: {
                id: tenantId,
                name: "Demo Company",
                slug: "demo-company",
                apiKey: apiKey,
                systemPrompt: "You are a helpful AI assistant."
            } as any
        });

        console.log("Created Tenant:", tenant);
        console.log("NEW_API_KEY:", tenant.apiKey);
    } catch (error) {
        console.error("Error seeding:", error);
    }
}

seed();
