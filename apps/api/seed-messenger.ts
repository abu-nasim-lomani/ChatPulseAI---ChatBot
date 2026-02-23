import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root of api
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
    const accessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('MESSENGER_PAGE_ACCESS_TOKEN not found in .env');
        process.exit(1);
    }

    console.log('Fetching Page ID from Facebook...');
    try {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
        const { id: pageId, name: pageName } = response.data;
        console.log(`Found Page: ${pageName} (${pageId})`);

        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error('No tenant found in database.');
            process.exit(1);
        }

        console.log(`Linking Page to Tenant: ${tenant.name} (${tenant.id})`);

        await prisma.integration.upsert({
            where: {
                tenantId_provider_pageId: {
                    tenantId: tenant.id,
                    provider: 'messenger',
                    pageId: pageId
                }
            },
            update: {
                accessToken: accessToken
            },
            create: {
                tenantId: tenant.id,
                provider: 'messenger',
                pageId: pageId,
                accessToken: accessToken
            }
        });

        console.log('Successfully seeded Messenger Integration!');

    } catch (error: any) {
        console.error('Failed to seed messenger:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
