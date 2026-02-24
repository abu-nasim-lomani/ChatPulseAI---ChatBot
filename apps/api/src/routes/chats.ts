import { Router, Request, Response } from 'express';
import { ChatService } from '../services/ChatService';

const router = Router();

// GET /chats/sessions/:tenantId
router.get('/sessions/:tenantId', async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const sessions = await ChatService.getSessions(tenantId as string);
        res.json({ status: 'success', data: sessions });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// GET /chats/messages/:sessionId
router.get('/messages/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const messages = await ChatService.getMessages(sessionId as string);
        res.json({ status: 'success', data: messages });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/reply
router.post('/reply', async (req: Request, res: Response) => {
    try {
        const { sessionId, text } = req.body;
        await ChatService.processAgentReply(sessionId, text);
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/request-agent
router.post('/request-agent', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.requestAgent(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Request Agent Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/end-agent-chat
router.post('/end-agent-chat', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.endAgentChat(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("End Agent Chat Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/accept-agent
router.post('/accept-agent', async (req: Request, res: Response) => {
    try {
        const { sessionId, agentName } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.acceptAgent(sessionId, agentName);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Accept Agent Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/reject-agent
router.post('/reject-agent', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.rejectAgent(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Reject Agent Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// GET /chats/session-status (for widget polling)
router.get('/session-status', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        const session = await ChatService.getSessionById(sessionId as string);

        if (!session) {
            res.status(404).json({ status: 'error', message: 'Session not found' });
            return;
        }

        res.json({ status: session.status, isBlocked: session.endUser?.isBlocked });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/read
router.post('/read', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.markAsRead(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/clear-conversation
router.post('/clear-conversation', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.clearConversation(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Clear Conversation Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/delete-session
router.post('/delete-session', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }

        await ChatService.deleteSession(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Delete Session Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/block-user
router.post('/block-user', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }
        await ChatService.blockUser(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Block User Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/unblock-user
router.post('/unblock-user', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }
        await ChatService.unblockUser(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Unblock User Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/restrict-session
router.post('/restrict-session', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }
        await ChatService.restrictSession(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Restrict Session Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

// POST /chats/unrestrict-session
router.post('/unrestrict-session', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ status: 'error', message: 'Session ID is required' });
            return;
        }
        await ChatService.unrestrictSession(sessionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Unrestrict Session Error:", error);
        res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
});

export default router;
