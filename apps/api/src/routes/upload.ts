import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the directory exists
        const dir = path.join(__dirname, '../../public/avatars');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Create unique filenames based on timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'));
        }
    }
});

// POST /upload/avatar
router.post('/avatar', upload.single('avatar'), (req: Request, res: Response): void => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        // Construct the full URL to the uploaded file
        const host = req.protocol + '://' + req.get('host');
        const fileUrl = `${host}/public/avatars/${req.file.filename}`;

        res.json({ success: true, url: fileUrl });
    } catch (error: any) {
        console.error('[Upload] Error:', error);
        res.status(500).json({ error: error.message || 'Server Error' });
    }
});

export default router;
