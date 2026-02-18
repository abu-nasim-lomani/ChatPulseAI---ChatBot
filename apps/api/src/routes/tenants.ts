import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// PATCH /tenants/settings
// Update tenant settings (System Prompt + chatConfig)
router.patch('/settings', async (req, res) => {
    try {
        const { tenantId, systemPrompt, chatConfig } = req.body;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        const updateData: any = {};
        if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
        if (chatConfig !== undefined) updateData.chatConfig = chatConfig;

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData
        });

        res.json({ success: true, tenant: updatedTenant });
    } catch (error: any) {
        console.error('[Tenant Settings] Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// GET /tenants/settings
// Get current settings
router.get('/settings', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId as string }
        });

        if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }

        res.json({
            systemPrompt: (tenant as any).systemPrompt,
            chatConfig: (tenant as any).chatConfig
        });
    } catch (error: any) {
        console.error('[Tenant Settings] Error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

export default router;
