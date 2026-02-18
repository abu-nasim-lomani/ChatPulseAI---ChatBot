import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import healthRoutes from './routes/health';
import messageRoutes from './routes/messages';
import chatRoutes from './routes/chats';
import knowledgeRoutes from './routes/knowledge';
import tenantsRoutes from './routes/tenants';

// Load .env from the correct path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
    next();
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
// Routes
app.use('/health', healthRoutes);
app.use('/messages', messageRoutes); // Widget API
app.use('/chats', chatRoutes);       // Dashboard API
app.use('/knowledge', knowledgeRoutes); // Knowledge Base API
app.use('/tenants', tenantsRoutes);     // Tenant Settings API

app.get('/', (req: Request, res: Response) => {
    res.send('SaaS Chatbot API is running!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
