import { Router, Request, Response } from 'express';
// import { MockAIService } from '../services/MockAIService'; // Removed
import { ChatService } from '../services/ChatService';

const router = Router();

// GET /messages?tenant_id=...&visitor_id=...
router.get('/', async (req: Request, res: Response) => {
    const { tenant_id, visitor_id } = req.query;

    if (!tenant_id || !visitor_id) {
        res.status(400).json({ status: 'error', message: 'Missing tenant_id or visitor_id' });
        return;
    }

    try {
        const messages = await ChatService.getVisitorMessages(tenant_id as string, visitor_id as string);
        res.json({
            status: 'success',
            data: messages
        });
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// POST /messages
router.post('/', async (req: Request, res: Response) => {
    const { tenant_id, text, sender } = req.body;

    try {
        // Use Chat Service (Database + AI)
        const { sessionId, reply } = await ChatService.processMessage(tenant_id, text, sender);

        res.json({
            status: 'success',
            data: {
                sessionId: sessionId,
                reply: reply
            }
        });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

export default router;
