
import { Router } from 'express';
import { MessengerService } from '../services/MessengerService';
import { ChatService } from '../services/ChatService';
import prisma from '../lib/prisma';

const router = Router();

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || 'chatbot_verify_123';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID; // Fallback if no specific logic

// GET /messenger/webhook - Verification
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Messenger] Webhook Verified!');
            res.status(200).send(challenge);
        } else {
            console.error('[Messenger] Validation Failed');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// POST /messenger/webhook - Message Handling
router.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        // Acknowledge receipt immediately
        res.status(200).send('EVENT_RECEIVED');

        for (const entry of body.entry) {
            const pageId = entry.id; // This is the Facebook Page ID
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                const text = webhookEvent.message.text;
                console.log(`[Messenger] Message from ${senderId} to Page ${pageId}: ${text}`);

                try {
                    // 1. Find Tenant Integration by Page ID
                    const integration = await prisma.integration.findFirst({
                        where: {
                            provider: 'messenger',
                            pageId: pageId
                        },
                        include: { tenant: true }
                    });

                    if (!integration || !integration.accessToken) {
                        console.error(`[Messenger] No integration found or access token missing for Page ID: ${pageId}`);
                        continue;
                    }

                    // Send typing indicator
                    await MessengerService.sendTypingIndicator(senderId, integration.accessToken);

                    // Fetch the user's real Facebook profile name and picture
                    const { name: userName, profilePic } = await MessengerService.getUserProfile(senderId, integration.accessToken);

                    // 2. Process with ChatService using the Tenant's API Key and explicitly declare 'messenger' source
                    const formattedSenderId = `messenger-${senderId}`;
                    const result = await ChatService.processMessage(integration.tenant.apiKey, text, formattedSenderId, 'messenger', userName, profilePic);

                    // 3. Send Response using the Tenant's Access Token
                    if (result.reply) {
                        await MessengerService.sendMessage(senderId, result.reply, integration.accessToken);
                    } else {
                        console.log('[Messenger] No AI reply (Agent mode or Silent)');
                    }

                } catch (error) {
                    console.error('[Messenger] Error processing message:', error);
                    // Optionally send an error message back to the user, but be careful not to loop
                    // await MessengerService.sendMessage(senderId, "Sorry, I'm having trouble connecting right now.", integration.accessToken);
                }
            }
        }
    } else {
        res.sendStatus(404);
    }
});

export default router;
