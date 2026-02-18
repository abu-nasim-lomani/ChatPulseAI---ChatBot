import { Router } from 'express';
import { knowledgeService } from '../services/KnowledgeService';

const router = Router();

// POST /knowledge/add
router.post('/add', async (req, res) => {
    console.log('[Knowledge] POST /add - Request received');
    try {
        const { tenantId, content, source } = req.body;
        console.log('[Knowledge] Params:', { tenantId, contentLength: content?.length, source });

        if (!tenantId || !content) {
            console.error('[Knowledge] Missing required fields');
            res.status(400).json({ error: 'Missing tenantId or content' });
            return;
        }

        console.log('[Knowledge] Calling addKnowledge...');
        const chunk = await knowledgeService.addKnowledge(tenantId, content, source);
        console.log('[Knowledge] Success!');
        res.json({ success: true, chunk });
    } catch (error: any) {
        console.error('[Knowledge] ERROR:', error.message);
        console.error('[Knowledge] Stack:', error.stack);
        res.status(500).json({ error: 'Failed to add knowledge' });
    }
});

// GET /knowledge/list?tenantId=...
router.get('/list', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) {
            res.status(400).json({ error: 'Missing tenantId' });
            return;
        }
        const chunks = await knowledgeService.listKnowledge(tenantId as string);
        res.json(chunks);
    } catch (error: any) {
        console.error('[Knowledge] List Error:', error);
        res.status(500).json({ error: 'Failed to fetch knowledge' });
    }
});

// POST /knowledge/query (Testing purpose)
router.post('/query', async (req, res) => {
    try {
        const { tenantId, query } = req.body;
        const results = await knowledgeService.queryKnowledge(tenantId, query);
        res.json({ matches: results });
    } catch (error) {
        res.status(500).json({ error: 'Failed to query knowledge' });
    }
});

export default router;
