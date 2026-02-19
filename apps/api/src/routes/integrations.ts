import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MessengerService } from '../services/MessengerService';
import axios from 'axios';

const router = Router();

// POST /integrations/messenger
// Save Facebook Page ID and Access Token
router.post('/messenger', async (req: Request, res: Response) => {
    try {
        const { pageId, accessToken, tenantId } = req.body;

        if (!pageId || !accessToken || !tenantId) {
            res.status(400).json({ status: 'error', message: 'Page ID, Access Token, and Tenant ID are required' });
            return;
        }

        // Verify the token is valid by making a call to Facebook
        // We can check /me?access_token=... to ensure it matches the Page ID
        try {
            const fbRes = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
            if (fbRes.data.id !== pageId) {
                res.status(400).json({ status: 'error', message: 'Access Token does not match the provided Page ID' });
                return;
            }
        } catch (fbError) {
            res.status(400).json({ status: 'error', message: 'Invalid Access Token or Page ID' });
            return;
        }

        // Save to Database
        const integration = await prisma.integration.upsert({
            where: {
                tenantId_provider_pageId: {
                    tenantId: tenantId,
                    provider: 'messenger',
                    pageId: pageId
                }
            },
            update: {
                accessToken: accessToken,
                // If specific fields change, update them
            },
            create: {
                tenantId: tenantId,
                provider: 'messenger',
                pageId: pageId,
                accessToken: accessToken
            }
        });

        res.json({ status: 'success', data: integration });

    } catch (error) {
        console.error('[Integration] Error saving messenger config:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// GET /integrations/messenger/:tenantId
// Check if connected
router.get('/messenger/:tenantId', async (req: Request, res: Response) => {
    try {
        const tenantId = req.params.tenantId as string;

        const integration = await prisma.integration.findFirst({
            where: {
                tenantId: tenantId,
                provider: 'messenger'
            }
        });

        if (integration) {
            res.json({
                status: 'success',
                connected: true,
                pageId: integration.pageId,
                updatedAt: integration.updatedAt
            });
        } else {
            res.json({ status: 'success', connected: false });
        }

    } catch (error) {
        console.error('[Integration] Error fetching messenger status:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// DELETE /integrations/messenger
router.post('/messenger/disconnect', async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.body;

        await prisma.integration.deleteMany({
            where: {
                tenantId: tenantId,
                provider: 'messenger'
            }
        });

        res.json({ status: 'success', message: 'Disconnected successfully' });

    } catch (error) {
        console.error('[Integration] Error disconnecting messenger:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

export default router;
