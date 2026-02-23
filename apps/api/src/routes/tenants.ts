import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// PATCH /tenants/settings
// Update tenant settings (System Prompt + chatConfig)
router.patch('/settings', async (req, res) => {
    try {
        const { tenantId, systemPrompt, chatConfig, widgetConfig } = req.body;
        console.log('[Tenant Settings] PATCH request received for tenantId:', tenantId);

        if (!tenantId) {
            console.error('[Tenant Settings] Missing tenantId in body');
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        const updateData: any = {};
        if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
        if (chatConfig !== undefined) updateData.chatConfig = chatConfig;
        if (widgetConfig !== undefined) updateData.widgetConfig = widgetConfig;

        console.log('[Tenant Settings] Updating tenant:', tenantId, 'with data:', JSON.stringify(updateData));

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId }, // Fixed: apiKey -> id
            data: updateData
        });

        console.log('[Tenant Settings] Update successful for:', tenantId);
        res.json({ success: true, tenant: updatedTenant });
    } catch (error: any) {
        console.error('[Tenant Settings] PATCH CRITICAL ERROR:', error);
        res.status(500).json({
            error: 'Failed to update settings',
            details: error.message
        });
    }
});

// GET /tenants/settings
// Get current settings
// GET /tenants/settings
// Get current settings
router.get('/settings', async (req, res) => {
    try {
        const { tenantId } = req.query;
        console.log('[Tenant Settings] GET request received. Query tenantId:', tenantId);

        if (!tenantId) {
            console.error('[Tenant Settings] Missing tenantId in query parameters');
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        console.log(`[Tenant Settings] strict lookup for tenantId: "${tenantId}"`);

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId as string }
        });

        if (!tenant) {
            console.error(`[Tenant Settings] No tenant found with ID: "${tenantId}"`);
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }

        console.log('[Tenant Settings] Tenant found:', tenant.id);

        res.json({
            systemPrompt: (tenant as any).systemPrompt,
            chatConfig: (tenant as any).chatConfig,
            widgetConfig: (tenant as any).widgetConfig
        });
    } catch (error: any) {
        console.error('[Tenant Settings] CRITICAL ERROR:', error);
        res.status(500).json({
            error: 'Failed to fetch settings',
            details: error.message,
            stack: error.stack
        });
    }
});

// GET /tenants/leads
// Fetch collected leads for a tenant
router.get('/leads', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId || typeof tenantId !== 'string') {
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        const leads = await prisma.lead.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ leads });
    } catch (error: any) {
        console.error('[Tenants API] Error fetching leads:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
