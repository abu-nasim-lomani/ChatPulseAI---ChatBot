import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /notes/:sessionId — get all notes for a session
router.get('/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const notes = await prisma.agentNote.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ data: notes });
    } catch (err) {
        console.error('[Notes] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// POST /notes — create a new note
router.post('/', async (req: Request, res: Response) => {
    try {
        const { sessionId, agentName, content } = req.body;
        if (!sessionId || !content?.trim()) {
            res.status(400).json({ error: 'sessionId and content are required' });
            return;
        }
        const note = await prisma.agentNote.create({
            data: { sessionId, agentName: agentName || 'Agent', content: content.trim() },
        });
        res.json({ data: note });
    } catch (err) {
        console.error('[Notes] POST error:', err);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// DELETE /notes/:id — delete a note
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.agentNote.delete({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('[Notes] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;
