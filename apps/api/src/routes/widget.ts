import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /widget/config
// Public endpoint for the widget script to load customization config
router.get('/config', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { apiKey: tenantId as string },
                    { id: tenantId as string }
                ]
            }
        });

        if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }

        // 3. Security Check: Validate Origin or Referer
        const config = (tenant as any).widgetConfig || {};
        const allowedDomains: string[] = config.allowedDomains || [];

        if (allowedDomains.length > 0) {
            const origin = req.get('Origin') || req.get('Referer') || '';
            const requestDomain = origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

            // Allow localhost for development, otherwise check against the whitelist
            const isLocalhost = requestDomain.includes('localhost') || requestDomain.includes('127.0.0.1');

            if (!isLocalhost && requestDomain !== '' && !allowedDomains.includes(requestDomain)) {
                console.warn(`[Widget API] Blocked layout request from unauthorized domain: ${requestDomain} for tenant ${tenantId}`);
                res.status(403).json({ error: 'Origin not allowed' });
                return;
            }
        }

        // Return the widget config
        res.json({ config });
    } catch (error: any) {
        console.error('[Widget API] Error fetching config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /widget/lead
// Public endpoint for the widget to submit lead form data
router.post('/lead', async (req, res) => {
    try {
        const { tenantId, name, email, phone, company, customData, sessionId, source } = req.body;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { apiKey: tenantId },
                    { id: tenantId }
                ]
            }
        });

        if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }

        const lead = await prisma.lead.create({
            data: {
                tenantId: tenant.id,
                name: name || null,
                email: email || null,
                phone: phone || null,
                company: company || null,
                customData: customData || null,
                sessionId: sessionId || null,
                source: source || 'widget'
            }
        });

        res.status(201).json({ success: true, lead: { id: lead.id } });
    } catch (error: any) {
        console.error('[Widget API] Error saving lead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

// End of file - forced reload
