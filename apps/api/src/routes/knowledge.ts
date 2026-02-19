import { Router } from 'express';
import { knowledgeService } from '../services/KnowledgeService';
import prisma from '../lib/prisma';

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

// DELETE /knowledge/delete?tenantId=...&source=...
router.delete('/delete', async (req, res) => {
    try {
        const { tenantId, source } = req.query;
        if (!tenantId || !source) {
            res.status(400).json({ error: 'Missing tenantId or source' });
            return;
        }

        // Delete all chunks for this source
        const count = await knowledgeService.deleteKnowledgeBySource(tenantId as string, source as string);
        res.json({ success: true, deletedCount: count });
    } catch (error: any) {
        console.error('[Knowledge] Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete knowledge' });
    }
});

// GET /knowledge/content?tenantId=...&source=...
router.get('/content', async (req, res) => {
    try {
        const { tenantId, source } = req.query;

        if (!tenantId || !source) {
            res.status(400).json({ error: 'Missing tenantId or source' });
            return;
        }

        // Find all chunks for this source
        const chunks = await prisma.knowledgeChunk.findMany({
            where: {
                tenantId: tenantId as string,
                source: source as string
            },
            orderBy: { createdAt: 'asc' }
        });

        if (chunks.length === 0) {
            res.status(404).json({ error: 'Content not found' });
            return;
        }

        // Combine chunks to reconstruct the full content
        const fullContent = chunks.map(c => c.content).join('\n\n');

        res.json({ content: fullContent });
    } catch (error: any) {
        console.error('[Knowledge] Content Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileService } from '../services/FileService';

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /knowledge/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { tenantId } = req.body;
        const file = req.file;

        if (!tenantId || !file) {
            res.status(400).json({ error: 'Missing tenantId or file' });
            return;
        }

        console.log(`[Knowledge] Processing file: ${file.originalname} (${file.mimetype})`);

        // 1. Parse File Content
        const content = await FileService.parseFile(file.path, file.mimetype);

        if (!content || content.trim().length === 0) {
            throw new Error("Failed to extract text from file");
        }

        console.log(`[Knowledge] Extracted ${content.length} chars from file`);

        // 2. Add to Knowledge Base
        const chunk = await knowledgeService.addKnowledge(tenantId, content, file.originalname);

        // 3. Cleanup
        await FileService.cleanup(file.path);

        res.json({ success: true, chunk });

    } catch (error: any) {
        console.error('[Knowledge] Upload Error:', error);
        // Cleanup on error
        if (req.file) await FileService.cleanup(req.file.path);
        res.status(500).json({ error: 'Failed to process file upload' });
    }
});

import { CrawlerService } from '../services/CrawlerService';

// POST /knowledge/crawl
router.post('/crawl', async (req, res) => {
    try {
        const { tenantId, url } = req.body;

        if (!tenantId || !url) {
            res.status(400).json({ error: 'Missing tenantId or url' });
            return;
        }

        console.log(`[Knowledge] Crawling URL: ${url}`);

        // 1. Crawl URL
        const content = await CrawlerService.crawl(url);

        if (!content || content.length === 0) {
            throw new Error("Failed to extract content from URL");
        }

        console.log(`[Knowledge] Extracted ${content.length} chars from URL`);

        // 2. Add to Knowledge Base
        const chunk = await knowledgeService.addKnowledge(tenantId, content, url);

        res.json({ success: true, chunk });

    } catch (error: any) {
        console.error('[Knowledge] Crawl Error:', error);
        res.status(500).json({ error: 'Failed to crawl URL' });
    }
});

export default router;
