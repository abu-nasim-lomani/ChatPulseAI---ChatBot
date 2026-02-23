import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MessengerService } from '../services/MessengerService';
import axios from 'axios';

const router = Router();

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FB_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3001/integrations/messenger/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// GET /integrations/messenger/auth (Step 1: Redirect to Facebook)
router.get('/messenger/auth', (req: Request, res: Response) => {
    const { tenantId } = req.query;
    if (!tenantId) {
        res.status(400).send('tenantId is required');
        return;
    }

    if (!FB_APP_ID || !FB_APP_SECRET) {
        res.status(500).send('Facebook OAuth is not configured on the server. Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env');
        return;
    }

    const state = encodeURIComponent(tenantId as string);
    const scope = 'pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement';
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${FB_REDIRECT_URI}&state=${state}&scope=${scope}`;

    res.redirect(authUrl);
});

// GET /integrations/messenger/callback (Step 2: Handle redirect, fetch token)
router.get('/messenger/callback', async (req: Request, res: Response) => {
    const { code, state, error } = req.query;
    if (error || !code || !state) {
        console.error('[Messenger OAuth] Error or missing params:', req.query);
        res.redirect(`${FRONTEND_URL}/dashboard/integration?error=oauth_failed`);
        return;
    }

    try {
        const tenantId = decodeURIComponent(state as string);

        // Exchange code for Short-Lived User Access Token
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${FB_REDIRECT_URI}&client_secret=${FB_APP_SECRET}&code=${code}`;
        const tokenRes = await axios.get(tokenUrl);
        const shortLivedToken = tokenRes.data.access_token;

        // Exchange for Long-Lived User Access Token
        const longTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
        const longTokenRes = await axios.get(longTokenUrl);
        const longLivedToken = longTokenRes.data.access_token;

        // Redirect to Frontend with the Long-Lived Token
        res.redirect(`${FRONTEND_URL}/dashboard/integration?fb_token=${longLivedToken}`);
    } catch (err: any) {
        console.error('[Messenger OAuth] Failed to exchange token:', err.response?.data || err.message);
        res.redirect(`${FRONTEND_URL}/dashboard/integration?error=oauth_exchange_failed`);
    }
});

// GET /integrations/messenger/pages (Step 3: Fetch User Pages)
router.get('/messenger/pages', async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        if (!token) {
            res.status(400).json({ status: 'error', message: 'Token is required' });
            return;
        }

        // Fetch pages the user has access to
        const fbRes = await axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
        res.json({ status: 'success', data: fbRes.data.data }); // Array of { id, name, access_token }
    } catch (err: any) {
        console.error('[Messenger] Failed to fetch pages:', err.response?.data || err.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch Facebook pages' });
    }
});

// POST /integrations/messenger/subscribe (Step 4: Subscribe webhook and save config)
router.post('/messenger/subscribe', async (req: Request, res: Response) => {
    try {
        const { pageId, pageAccessToken, tenantId } = req.body;

        if (!pageId || !pageAccessToken || !tenantId) {
            res.status(400).json({ status: 'error', message: 'Page ID, Page Access Token, and Tenant ID are required' });
            return;
        }

        // 1. Subscribe Page to our App's Webhook
        try {
            await axios.post(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`, {
                subscribed_fields: ['messages', 'messaging_postbacks']
            }, {
                headers: { Authorization: `Bearer ${pageAccessToken}` }
            });
            console.log(`[Messenger] Subscribed App to Page ${pageId}`);
        } catch (fbError: any) {
            console.error('[Messenger] Failed to subscribe webhook:', fbError.response?.data || fbError.message);
            res.status(400).json({ status: 'error', message: 'Failed to subscribe webhook to Facebook Page.' });
            return;
        }

        // 2. Save to Database
        const integration = await prisma.integration.upsert({
            where: {
                tenantId_provider_pageId: {
                    tenantId: tenantId,
                    provider: 'messenger',
                    pageId: pageId
                }
            },
            update: {
                accessToken: pageAccessToken,
            },
            create: {
                tenantId: tenantId,
                provider: 'messenger',
                pageId: pageId,
                accessToken: pageAccessToken
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
