const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function testMessengerReply() {
    console.log("--- STARTING TEST MESSENGER REPLY ---");

    // 1. Get the latest Messenger user
    const endUser = await prisma.endUser.findFirst({
        where: {
            externalId: {
                startsWith: 'messenger-'
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!endUser) {
        console.log("No Messenger users found in database.");
        return;
    }

    console.log("Found recent Messenger user:", endUser.externalId);

    // 2. Get the tenant's integration config
    const integration = await prisma.integration.findFirst({
        where: {
            tenantId: endUser.tenantId,
            provider: 'messenger'
        }
    });

    if (!integration || !integration.accessToken) {
        console.log("No active Messenger integration found for this tenant.");
        return;
    }

    console.log("Integration found with Token:", !!integration.accessToken);

    // 3. Send a test message
    const messengerId = endUser.externalId.replace('messenger-', '');
    console.log("Attempting to send payload to Facebook Graph API for recipient:", messengerId);

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${integration.accessToken}`,
            {
                recipient: { id: messengerId },
                message: { text: "Hello from Chatbot Dashboard! This is a test message to verify routing." }
            }
        );
        console.log("[SUCCESS] Graph API responded with:", response.data);
    } catch (error) {
        console.error("[ERROR] Facebook API rejected the message:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testMessengerReply().finally(() => prisma.$disconnect());
