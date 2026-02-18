import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file explicitly - go up 2 levels from src/lib to api root
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('[Prisma] Error loading .env:', result.error);
} else {
    console.log(`[Prisma] ✅ Loaded ${Object.keys(result.parsed || {}).length} environment variables from ${envPath}`);
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
