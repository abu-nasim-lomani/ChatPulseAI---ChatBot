import prisma from '../lib/prisma';
import { MockAIService } from './MockAIService';
import { AnalyzerService } from './AnalyzerService';
import { knowledgeService } from './KnowledgeService';
import { getChatModel, AIProvider } from '../lib/ai-config';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Get provider from env (default: ollama)
const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama') as AIProvider;
const chatModel = getChatModel(AI_PROVIDER);

export class ChatService {
    static async processMessage(apiKey: string, text: string, senderId: string = 'visitor') {

        // 1. Find Tenant
        const tenant = await prisma.tenant.findUnique({
            where: { apiKey: apiKey }
        }) as any; // Cast to any to avoid type error until Prisma client regenerates completely

        if (!tenant) {
            throw new Error('Invalid Tenant API Key');
        }

        // 2. Find or Create User
        // For simplicity, we use senderId as externalId. In real app, we might use cookies/JWT.
        let endUser = await prisma.endUser.findFirst({
            where: { tenantId: tenant.id, externalId: 'visitor-' + senderId } // Simple hack for now
        });

        if (!endUser) {
            endUser = await prisma.endUser.create({
                data: {
                    tenantId: tenant.id,
                    externalId: 'visitor-' + senderId,
                    name: 'Guest Visitor'
                }
            });
        }

        // 3. Find or Create Session (Last 24 hours?)
        // For now, simple logic: just get the latest session or create new
        let session = await prisma.chatSession.findFirst({
            where: { endUserId: endUser.id },
            orderBy: { createdAt: 'desc' }
        });

        if (!session) {
            session = await prisma.chatSession.create({
                data: {
                    tenantId: tenant.id,
                    endUserId: endUser.id
                }
            });
        }

        // 4. Analyze Sentiment
        const sentiment = AnalyzerService.analyze(text);

        // 5. Save User Message with Sentiment
        await prisma.chatMessage.create({
            data: {
                sessionId: session.id,
                role: 'user',
                content: text,
                sentimentScore: sentiment.score,
                sentimentLabel: sentiment.label
            }
        });

        // Update Session Mood
        await prisma.chatSession.update({
            where: { id: session.id },
            data: { currentMood: sentiment.mood }
        });

        // 6. Check if Agent is Connected (Live Chat Mode)
        if (session.status === 'agent_connected') {
            // Agent is live - AI is COMPLETELY SILENT
            // Don't send any response, agent will handle it
            return {
                sessionId: session.id,
                reply: null  // No AI response
            };
        }

        // 7. Check if Agent Requested (Waiting Mode)
        if (session.status === 'agent_requested') {
            // Don't send AI response, just save a system notification
            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'assistant',
                    content: 'Your message has been received. An agent will respond shortly.'
                }
            });

            return {
                sessionId: session.id,
                reply: 'Your message has been received. An agent will respond shortly.'
            };
        }

        // 8. Generate AI Response (RAG: Knowledge + Gemini)
        let aiResponseText = "";
        try {
            // A. Retrieve Context from Knowledge Base
            const contextChunks = await knowledgeService.queryKnowledge(tenant.id, text);
            const context = contextChunks.join("\n\n");

            // B. Construct Prompt
            // B. Construct Prompt
            const defaultPrompt = `You are an expert AI customer support agent.
            Your goal is to provide accurate, helpful, and concise answers based STRICTLY on the provided context.
            
            Guidelines:
            1. Use ONLY the provided context to answer. Do not make up information.
            2. If the answer is not in the context, politely say: "I don't have that information right now. Would you like to speak with a human agent?"
            3. Keep answers short (2-3 sentences max) unless a detailed explanation is needed.
            4. Be professional, friendly, and empathetic.`;

            const systemPrompt = `${tenant.systemPrompt || defaultPrompt}
            
            Context:
            ${context}`;

            // C. Call Gemini
            const response = await chatModel.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(text)
            ]);

            aiResponseText = response.content as string;

        } catch (error) {
            console.error("AI Generation Failed:", error);
            // Fallback to Mock if AI fails
            aiResponseText = "I'm having trouble connecting to my brain right now. Please try again later.";
        }


        // 9. Save Bot Message
        await prisma.chatMessage.create({
            data: {
                sessionId: session.id,
                role: 'assistant',
                content: aiResponseText
            }
        });

        return {
            sessionId: session.id,
            reply: aiResponseText
        };
    }

    static async getSessions(tenantId: string) {
        // Find tenant by Public ID (slug or uuid) or API Key? 
        // For Dashboard, we likely use internal Tenant ID. 
        // Let's assume tenantId passed here is the internal UUID or we lookup by apiKey.
        // For now, let's assume it's the internal UUID (which we can get from DB seed).

        // Actually, let's look up by apiKey for consistency with widget, 
        // OR assume the dashboard knows the internal ID. 
        // Let's use apiKey for now as "Tenant Identifier" to keep it simple.

        const tenant = await prisma.tenant.findUnique({
            where: { apiKey: tenantId } // Using apiKey as "ID" for now
        });

        if (!tenant) return [];

        return await prisma.chatSession.findMany({
            where: { tenantId: tenant.id },
            include: {
                endUser: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    static async getMessages(sessionId: string) {
        return await prisma.chatMessage.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'asc' }
        });
    }

    // Get Session By ID
    static async getSessionById(sessionId: string) {
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                endUser: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        return session;
    }

    static async getVisitorMessages(apiKey: string, visitorId: string) {
        const tenant = await prisma.tenant.findUnique({ where: { apiKey } });
        if (!tenant) return [];

        const externalId = 'visitor-' + visitorId;

        const endUser = await prisma.endUser.findFirst({
            where: { tenantId: tenant.id, externalId: externalId }
        });

        if (!endUser) return [];

        const session = await prisma.chatSession.findFirst({
            where: { endUserId: endUser.id },
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!session) return [];
        return session.messages;
    }

    static async processAgentReply(sessionId: string, text: string) {
        // Get current session to check status
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) throw new Error('Session not found');

        // Determine if this is first agent reply
        const isFirstReply = session.status === 'agent_requested';

        // Save agent's message
        await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'assistant',
                content: text
            }
        });

        // Add system message if agent joining
        if (isFirstReply) {
            await prisma.chatMessage.create({
                data: {
                    sessionId: sessionId,
                    role: 'system',
                    content: '🟢 Agent has joined the chat'
                }
            });
        }

        // Update status: first reply connects agent
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                updatedAt: new Date(),
                status: isFirstReply ? 'agent_connected' : session.status  // First reply connects agent
            }
        });

        return { status: 'sent' };
    }

    static async requestAgent(sessionId: string) {
        // 1. Update Session Status
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'agent_requested' }
        });

        // 2. Add System Message
        await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: 'User has requested a human agent. Please respond.',
                sentimentLabel: 'neutral'
            }
        });

        return { success: true };
    }

    static async endAgentChat(sessionId: string) {
        // Update session to active
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'active' }
        });

        // Add system message
        await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: '👋 Agent has left the chat. AI assistant resumed.'
            }
        });

        return { success: true };
    }

    static async acceptAgent(sessionId: string, agentName: string = 'Support Agent') {
        // Update session to agent_connected
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'agent_connected' }
        });

        // Add system message
        await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: `🟢 ${agentName} has accepted your request and joined the chat`
            }
        });

        return { success: true };
    }

    static async rejectAgent(sessionId: string) {
        // Update session back to active
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'active' }
        });

        // Add system message
        await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: '❌ Agent is currently unavailable. AI assistant will continue to help you.'
            }
        });

        return { success: true };
    }
}
