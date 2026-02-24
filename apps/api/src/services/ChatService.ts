import prisma from '../lib/prisma';
import { AnalyzerService } from './AnalyzerService';
import { knowledgeService } from './KnowledgeService';
import { getChatModel, AIProvider } from '../lib/ai-config';
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { WhatsAppService } from './WhatsAppService';
import { socketService } from './SocketService';


export class ChatService {
    static async processMessage(apiKey: string, text: string, senderId: string = 'visitor', source: string = 'widget', userName: string = 'Guest Visitor', profilePic: string | null = null) {


        // 1. Find Tenant
        // Try to find by apiKey first, then by id (to support both)
        let tenant = await prisma.tenant.findUnique({
            where: { apiKey: apiKey }
        });

        if (!tenant) {
            // Fallback: Check if the key provided is actually the tenant ID
            tenant = await prisma.tenant.findUnique({
                where: { id: apiKey }
            });
        }

        if (!tenant) {
            throw new Error('Invalid Tenant API Key or ID');
        }

        // 2. Find or Create User
        // For simplicity, we use senderId as externalId. In real app, we might use cookies/JWT.
        let externalId = senderId;
        if (!senderId.startsWith('visitor-') && !senderId.startsWith('messenger-') && !senderId.startsWith('wa_')) {
            externalId = 'visitor-' + senderId;
        }

        let endUser = await prisma.endUser.findFirst({
            where: { tenantId: tenant.id, externalId: externalId } // Simple hack for now
        });

        if (!endUser) {
            endUser = await prisma.endUser.create({
                data: {
                    tenantId: tenant.id,
                    externalId: externalId,
                    name: userName,
                    profilePic: profilePic
                }
            });
        } else if ((endUser.name === 'Guest Visitor' && userName !== 'Guest Visitor') || (!endUser.profilePic && profilePic)) {
            endUser = await prisma.endUser.update({
                where: { id: endUser.id },
                data: {
                    name: userName !== 'Guest Visitor' ? userName : endUser.name,
                    profilePic: profilePic || endUser.profilePic
                }
            });
        }

        if (endUser.isBlocked) {
            throw new Error('You have been blocked from sending messages.');
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
        const userMsg = await prisma.chatMessage.create({
            data: {
                sessionId: session.id,
                role: 'user',
                content: text,
                sentimentScore: sentiment.score,
                sentimentLabel: sentiment.label
            }
        });

        // Update Session Mood & Increment Unread Count
        const updatedSession = await prisma.chatSession.update({
            where: { id: session.id },
            data: {
                currentMood: sentiment.mood,
                unreadCount: { increment: 1 }
            },
            include: { endUser: true }
        });

        socketService.emitNewMessage(tenant.id, session.id, userMsg);
        socketService.emitSessionUpdate(tenant.id, { ...updatedSession, messages: [userMsg] });

        // Check if session is restricted
        if (session.isRestricted) {
            // Real message is saved, but AI is completely silent
            return {
                sessionId: session.id,
                reply: null
            };
        }

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
            const sysMsg = await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'assistant',
                    content: 'Your message has been received. An agent will respond shortly.'
                }
            });
            socketService.emitNewMessage(tenant.id, session.id, sysMsg);

            return {
                sessionId: session.id,
                reply: 'Your message has been received. An agent will respond shortly.'
            };
        }

        // 8. Generate AI Response (RAG: Knowledge + History)
        let aiResponseText = "";
        let aiTokensUsed = 0; // Initialize aiTokensUsed here

        try {
            // A. Retrieve Context from Knowledge Base
            const contextChunks = await knowledgeService.queryKnowledge(tenant.id, text);
            const context = contextChunks.join("\n\n");

            // E. Instantiate Dynamic AI Model for this Tenant
            const chatConfig = tenant.chatConfig as any;
            const activeProvider = chatConfig?.activeProvider || process.env.AI_PROVIDER || 'ollama';
            const providerConfig = chatConfig?.providers?.[activeProvider] || {};
            const fallbackMessage = chatConfig?.fallbackMessage || "I don't have that information right now. Would you like to speak with a human agent?";
            const welcomeMessage = chatConfig?.welcomeMessage || '';

            // B. Construct System Prompt (dynamically includes configurable fallback message)
            const defaultPrompt = `You are a professional AI customer support agent.
            
            INSTRUCTIONS:
            1. ANSWER ONLY based on the "Context" provided below.
            2. DIFFERENTIATE between "Context" (background info) and "User Query" (what they are asking right now).
            3. If the user's message is a greeting (e.g., "hi", "hello"), respond politely without trying to force context information (e.g., "${welcomeMessage || 'Hello! How can I assist you today?'}").
            4. If the answer is NOT in the context, say exactly: "${fallbackMessage}"
            5. IGNORE context that is irrelevant to the current user query.
            6. Keep answers concise, friendly, and professional.`;

            const systemPrompt = `${tenant.systemPrompt || defaultPrompt}
            
            Context:
            ${context}`;

            // C. Fetch last 10 messages for conversation history
            const recentMessages = await prisma.chatMessage.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' },
                take: 10
            });

            // D. Build history array (skip system messages)
            const historyMessages = recentMessages
                .map(msg => {
                    if (msg.role === 'user') return new HumanMessage(msg.content);
                    if (msg.role === 'assistant') return new AIMessage(msg.content);
                    return null;
                })
                .filter((m): m is HumanMessage | AIMessage => m !== null);



            const dynamicChatModel = getChatModel({
                provider: activeProvider as AIProvider,
                model: providerConfig.model,
                apiKey: providerConfig.apiKey
            });

            // F. Call AI with full conversation history
            const response = await dynamicChatModel.invoke([
                new SystemMessage(systemPrompt),
                ...historyMessages
            ]);

            aiResponseText = response.content as string;

            // Try to extract token usage (depends on the Langchain model version/provider)
            const usageMeta = (response as any).usage_metadata;
            const responseMeta = (response as any).response_metadata;

            aiTokensUsed = usageMeta?.total_tokens
                || responseMeta?.tokenUsage?.totalTokens
                || responseMeta?.estimatedTokenUsage?.totalTokens
                || 0;

        } catch (error) {
            console.error("AI Generation Failed:", error);
            // Fallback if AI fails
            aiResponseText = "I'm having trouble connecting to my brain right now. Please try again later.";
        }


        // 9. Save AI Response
        const aiMsg = await prisma.chatMessage.create({
            data: {
                sessionId: session.id,
                role: 'assistant',
                content: aiResponseText,
                tokensUsed: aiTokensUsed
            }
        });

        // Update session updatedAt to ensure it moves to top
        await prisma.chatSession.update({
            where: { id: session.id },
            data: { updatedAt: new Date() }
        });

        socketService.emitNewMessage(tenant.id, session.id, aiMsg);
        // 10. Route Reply back to Source if it's WhatsApp
        if (source === 'whatsapp') {
            // Find the integration to get the token again (or we could pass it down, but safer to re-fetch to ensure we have it)
            const integration = await prisma.integration.findFirst({
                where: { tenantId: tenant.id, provider: 'whatsapp' }
            });

            if (integration && integration.pageId && integration.accessToken) {
                // Remove the 'wa_' prefix to get pure phone number
                const cleanPhone = senderId.replace('wa_', '');
                await WhatsAppService.sendMessage(integration.pageId, integration.accessToken, cleanPhone, aiResponseText).catch(e => {
                    console.error('[WhatsAppService] Failed to send AI reply:', e);
                });
            }
        }

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

        // Try to find by ID (Dashboard usually sends ID)
        let tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            // Fallback: Check if the key provided is actually the apiKey
            tenant = await prisma.tenant.findUnique({
                where: { apiKey: tenantId }
            });
        }

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
        console.log(`[getVisitorMessages] START apiKey=${apiKey}, visitorId=${visitorId}`);
        let tenant = await prisma.tenant.findUnique({ where: { apiKey } });
        console.log(`[getVisitorMessages] tenant found by apiKey:`, !!tenant);

        if (!tenant) {
            // Fallback: Check if the key provided is actually the tenant ID
            tenant = await prisma.tenant.findUnique({ where: { id: apiKey } });
            console.log(`[getVisitorMessages] tenant found by id fallback:`, !!tenant);
        }

        if (!tenant) return [];

        const externalId = visitorId.startsWith('visitor-') ? visitorId : 'visitor-' + visitorId;
        console.log(`[getVisitorMessages] looking for EndUser with tenantId=${tenant.id}, externalId=${externalId}`);

        const endUser = await prisma.endUser.findFirst({
            where: { tenantId: tenant.id, externalId: externalId }
        });
        console.log(`[getVisitorMessages] endUser found:`, !!endUser, endUser?.id);

        if (!endUser) return [];

        const session = await prisma.chatSession.findFirst({
            where: { endUserId: endUser.id },
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        console.log(`[getVisitorMessages] session found:`, !!session, session?.id, `messages count:`, session?.messages?.length);

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
        const agentMsg = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'assistant',
                content: text
            }
        });
        socketService.emitNewMessage(session.tenantId, sessionId, agentMsg);

        // Add system message if agent joining
        if (isFirstReply) {
            const sysMsg = await prisma.chatMessage.create({
                data: {
                    sessionId: sessionId,
                    role: 'system',
                    content: '🟢 Agent has joined the chat'
                }
            });
            socketService.emitNewMessage(session.tenantId, sessionId, sysMsg);
        }

        // Update status: first reply connects agent
        const updatedSess = await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                updatedAt: new Date(),
                status: isFirstReply ? 'agent_connected' : session.status  // First reply connects agent
            },
            include: { endUser: true }
        });
        socketService.emitSessionUpdate(session.tenantId, { ...updatedSess, messages: [agentMsg] });

        // Add dispatch logic to route the human's reply back to Facebook or WhatsApp
        const endUser = await prisma.endUser.findUnique({ where: { id: session.endUserId || '' } });
        console.log(`[processAgentReply Dispatch] SessionId: ${sessionId}, endUserId: ${session.endUserId}`);
        console.log(`[processAgentReply Dispatch] endUser found:`, !!endUser);

        if (endUser && endUser.externalId) {
            const externalId = endUser.externalId;
            console.log(`[processAgentReply Dispatch] externalId: ${externalId}`);

            // Check if this is a Messenger user based on prefix or heavily numerical suffix (Facebook IDs are 15+ digit numbers)
            // It could be 'messenger-12345', 'visitor-12345', or 'visitor-visitor-12345'
            const isMessengerLike = externalId.startsWith('messenger-') ||
                (externalId.includes('-') && /^\d{15,}$/.test(externalId.split('-').pop() || ''));

            if (isMessengerLike) {
                // Extract pure numeric ID
                const messengerId = externalId.split('-').pop() || '';

                const integration = await prisma.integration.findFirst({
                    where: { tenantId: session.tenantId, provider: 'messenger' }
                });
                console.log(`[processAgentReply Dispatch] Messenger Integration found:`, !!integration, 'hasToken:', !!integration?.accessToken);

                if (integration && integration.accessToken && messengerId) {
                    console.log(`[processAgentReply Dispatch] Sending to Messenger ID: ${messengerId}`);
                    // Delay import to avoid circular dependencies if any
                    const { MessengerService } = await import('./MessengerService');
                    await MessengerService.sendMessage(messengerId, text, integration.accessToken);
                }
            } else if (externalId.startsWith('wa_')) {
                const integration = await prisma.integration.findFirst({
                    where: { tenantId: session.tenantId, provider: 'whatsapp' }
                });
                if (integration && integration.pageId && integration.accessToken) {
                    const cleanPhone = externalId.replace('wa_', '');
                    const { WhatsAppService } = await import('./WhatsAppService');
                    await WhatsAppService.sendMessage(integration.pageId, integration.accessToken, cleanPhone, text).catch(e => {
                        console.error('[WhatsAppService] Failed to send Agent reply:', e);
                    });
                }
            }
        }

        return { status: 'sent' };
    }

    static async requestAgent(sessionId: string) {
        // 1. Update Session Status
        const session = await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'agent_requested' },
            include: { endUser: true }
        });

        // 2. Add System Message
        const sysMsg = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: 'User has requested a human agent. Please respond.',
                sentimentLabel: 'neutral'
            }
        });

        socketService.emitNewMessage(session.tenantId, sessionId, sysMsg);
        socketService.emitSessionUpdate(session.tenantId, { ...session, messages: [sysMsg] });

        return { success: true };
    }

    static async endAgentChat(sessionId: string) {
        // Update session to active
        const session = await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'active' },
            include: { endUser: true }
        });

        // Add system message
        const sysMsg = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: '👋 Agent has left the chat. AI assistant resumed.'
            }
        });

        socketService.emitNewMessage(session.tenantId, sessionId, sysMsg);
        socketService.emitSessionUpdate(session.tenantId, { ...session, messages: [sysMsg] });

        return { success: true };
    }

    static async acceptAgent(sessionId: string, agentName: string = 'Support Agent') {
        // Update session to agent_connected
        const session = await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'agent_connected' },
            include: { endUser: true }
        });

        // Add system message
        const sysMsg = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: `🟢 ${agentName} has accepted your request and joined the chat`
            }
        });

        socketService.emitNewMessage(session.tenantId, sessionId, sysMsg);
        socketService.emitSessionUpdate(session.tenantId, { ...session, messages: [sysMsg] });

        return { success: true };
    }

    static async rejectAgent(sessionId: string) {
        // Update session back to active
        const session = await prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'active' },
            include: { endUser: true }
        });

        // Add system message
        const sysMsg = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'system',
                content: '❌ Agent is currently unavailable. AI assistant will continue to help you.'
            }
        });

        socketService.emitNewMessage(session.tenantId, sessionId, sysMsg);
        socketService.emitSessionUpdate(session.tenantId, { ...session, messages: [sysMsg] });

        return { success: true };
    }

    static async markAsRead(sessionId: string) {
        // ... (existing code)
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { unreadCount: 0 }
        });
        return { success: true };
    }

    static async clearConversation(sessionId: string) {
        await prisma.chatMessage.deleteMany({
            where: { sessionId: sessionId }
        });
        return { success: true };
    }

    static async deleteSession(sessionId: string) {
        // 1. Delete all messages first (FK constraint)
        await prisma.chatMessage.deleteMany({
            where: { sessionId }
        });

        // 2. Detach any leads linked to this session
        await (prisma as any).lead.updateMany({
            where: { sessionId },
            data: { sessionId: null }
        });

        // 3. Delete the session itself
        await prisma.chatSession.delete({
            where: { id: sessionId }
        });

        return { success: true };
    }

    static async blockUser(sessionId: string) {
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            select: { endUserId: true }
        });
        if (!session?.endUserId) throw new Error('Session or user not found');

        await prisma.endUser.update({
            where: { id: session.endUserId },
            data: { isBlocked: true }
        });
        return { success: true };
    }

    static async unblockUser(sessionId: string) {
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            select: { endUserId: true }
        });
        if (!session?.endUserId) throw new Error('Session or user not found');

        await prisma.endUser.update({
            where: { id: session.endUserId },
            data: { isBlocked: false }
        });
        return { success: true };
    }

    static async restrictSession(sessionId: string) {
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { isRestricted: true }
        });
        return { success: true };
    }

    static async unrestrictSession(sessionId: string) {
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { isRestricted: false }
        });
        return { success: true };
    }
}
