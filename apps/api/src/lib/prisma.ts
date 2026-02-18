import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file explicitly if not already loaded
if (!process.env.DATABASE_URL) {
    const envPath = path.resolve(__dirname, '../../.env');
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        // Suppress error if we are in production or if env is provided otherwise
        console.warn('[Prisma] Note: Could not load .env file from', envPath);
    } else {
        console.log(`[Prisma] ✅ Loaded env from ${envPath}`);
    }
}

// Fallback DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/chatbot_saas?schema=public';

console.log('[Prisma] Using DATABASE_URL:', DATABASE_URL ? '✅ Set' : '❌ Missing');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    },
    log: ['error', 'warn']
});

export default prisma;
