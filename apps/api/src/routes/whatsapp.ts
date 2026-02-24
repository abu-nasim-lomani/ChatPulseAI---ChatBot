import { Router, Request, Response } from 'express';
import { ChatService } from '../services/ChatService';
import prisma from '../lib/prisma';

const router = Router();

// GET /webhooks/whatsapp - Webhook Verification from Meta
router.get('/', (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsapp_verify_123';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[WhatsApp Webhook] Verified');
            res.status(200).send(challenge);
        } else {
            console.error('[WhatsApp Webhook] Verification Failed. Token mismatch.');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request
    }
});

// POST /webhooks/whatsapp - Receive Messages
router.post('/', async (req: Request, res: Response) => {
    try {
        const body = req.body;

        // Check if this is an event from a WhatsApp API
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                // Ensure there is a changes array
                if (!entry.changes || entry.changes.length === 0) continue;

                const change = entry.changes[0].value;
                const phoneNumberId = change.metadata?.phone_number_id; // The bot's phone number ID

                // Process messages
                if (change.messages && change.messages.length > 0) {
                    const message = change.messages[0];
                    const senderId = message.from; // The user's WhatsApp number

                    if (message.type === 'text') {
                        const messageText = message.text.body;
                        console.log(`[WhatsApp] Incoming from ${senderId} to ${phoneNumberId}: ${messageText}`);

                        // 1. Find the Tenant holding this WhatsApp Integration
                        const integration = await prisma.integration.findFirst({
                            where: { provider: 'whatsapp', pageId: phoneNumberId }
                        });

                        if (!integration) {
                            console.warn(`[WhatsApp] Message received for unlinked phone: ${phoneNumberId}`);
                            continue; // Cannot process, not linked in dashboard
                        }

                        // Extract User Name and Profile Picture from WhatsApp Contact Profile
                        let userName = 'Guest Visitor';
                        let profilePic: string | null = null;
                        if (change.contacts && change.contacts.length > 0) {
                            userName = change.contacts[0].profile?.name || 'Guest Visitor';
                            profilePic = change.contacts[0].profile?.profile_picture_url || null;
                        }

                        // 2. Process message via AI
                        const sessionId = `wa_${senderId}`; // Unique session ID prefix for WhatsApp

                        // We do not await this so it processes async, freeing the webhook
                        ChatService.processMessage(
                            integration.tenantId,
                            messageText,
                            sessionId,
                            'whatsapp',
                            userName,
                            profilePic
                        ).catch(err => {
                            console.error('[WhatsApp ChatService] Error:', err);
                        });
                    } else {
                        console.warn(`[WhatsApp] Received non-text message type: ${message.type}`);
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('[WhatsApp Webhook Error]', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
