import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import healthRoutes from './routes/health';
import messageRoutes from './routes/messages';
import chatRoutes from './routes/chats';
import knowledgeRoutes from './routes/knowledge';
import tenantsRoutes from './routes/tenants';
import messengerRoutes from './routes/messenger'; // Import messengerRoutes
import whatsappRoutes from './routes/whatsapp'; // Import whatsappRoutes
import integrationRoutes from './routes/integrations'; // Import integrationRoutes
import widgetRoutes from './routes/widget'; // Public widget API
import uploadRoutes from './routes/upload'; // Avatar Image Upload
import cannedResponsesRoutes from './routes/canned-responses'; // Canned Responses
import notesRoutes from './routes/notes'; // Internal Agent Notes
import analyticsRoutes from './routes/analytics'; // Analytics

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

import authRoutes from './routes/auth';

// ... (existing imports)

// Static Files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/auth', authRoutes);       // Authentication API
app.use('/health', healthRoutes);
app.use('/messages', messageRoutes); // Widget API
app.use('/chats', chatRoutes);       // Dashboard API
app.use('/knowledge', knowledgeRoutes); // Knowledge Base API
app.use('/tenants', tenantsRoutes);     // Tenant Settings API
app.use('/webhooks/messenger', messengerRoutes); // Messenger Webhook
app.use('/webhooks/whatsapp', whatsappRoutes); // WhatsApp Webhook
app.use('/integrations', integrationRoutes); // Integration API
app.use('/widget', widgetRoutes); // Public Widget Settings
app.use('/upload', uploadRoutes); // Unified uploads
app.use('/canned-responses', cannedResponsesRoutes); // Canned Responses CRUD
app.use('/notes', notesRoutes); // Internal Agent Notes
app.use('/analytics', analyticsRoutes); // Analytics Dashboard API

import http from 'http';
import { socketService } from './services/SocketService';

app.get('/', (req: Request, res: Response) => {
    res.send('SaaS Chatbot API is running!');
});

const server = http.createServer(app);

// Initialize Socket.IO Server
socketService.init(server);

server.listen(port, () => {
    console.log(`Server & WebSocket are running at http://localhost:${port}`);
});
