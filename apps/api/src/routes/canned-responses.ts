import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /canned-responses/:tenantId — list all canned responses for a tenant
router.get('/:tenantId', async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const responses = await prisma.cannedResponse.findMany({
            where: { tenantId },
            orderBy: { shortcut: 'asc' },
        });
        res.json({ data: responses });
    } catch (err) {
        console.error('[CannedResponses] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch canned responses' });
    }
});

// POST /canned-responses — create a new canned response
router.post('/', async (req: Request, res: Response) => {
    try {
        const { tenantId, shortcut, title, content } = req.body;
        if (!tenantId || !shortcut || !content) {
            res.status(400).json({ error: 'tenantId, shortcut, and content are required' });
            return;
        }
        const cleaned = shortcut.toLowerCase().replace(/[^a-z0-9_]/g, '');
        const response = await prisma.cannedResponse.create({
            data: { tenantId, shortcut: cleaned, title: title || cleaned, content },
        });
        res.json({ data: response });
    } catch (err: any) {
        if (err.code === 'P2002') {
            res.status(409).json({ error: `Shortcut "${req.body.shortcut}" already exists` });
            return;
        }
        console.error('[CannedResponses] POST error:', err);
        res.status(500).json({ error: 'Failed to create canned response' });
    }
});

// PUT /canned-responses/:id — update a canned response
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { shortcut, title, content } = req.body;
        const response = await prisma.cannedResponse.update({
            where: { id },
            data: {
                ...(shortcut && { shortcut: shortcut.toLowerCase().replace(/[^a-z0-9_]/g, '') }),
                ...(title && { title }),
                ...(content && { content }),
            },
        });
        res.json({ data: response });
    } catch (err) {
        console.error('[CannedResponses] PUT error:', err);
        res.status(500).json({ error: 'Failed to update canned response' });
    }
});

// DELETE /canned-responses/:id — delete a canned response
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.cannedResponse.delete({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('[CannedResponses] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete canned response' });
    }
});

export default router;
