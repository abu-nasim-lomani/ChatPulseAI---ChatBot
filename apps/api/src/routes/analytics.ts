import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function getSinceDate(range: string): Date {
    const now = new Date();
    switch (range) {
        case '1d': { const d = new Date(now); d.setHours(now.getHours() - 24); return d; }
        case '7d': { const d = new Date(now); d.setDate(now.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
        case '90d': { const d = new Date(now); d.setDate(now.getDate() - 89); d.setHours(0, 0, 0, 0); return d; }
        case '30d':
        default: { const d = new Date(now); d.setDate(now.getDate() - 29); d.setHours(0, 0, 0, 0); return d; }
    }
}

// GET /analytics/:tenantId?range=1d|7d|30d|90d
router.get('/:tenantId', async (req: Request, res: Response) => {
    try {
        const tenantId = req.params.tenantId as string;
        const range = (req.query.range as string) || '30d';
        const since = getSinceDate(range);
        const now = new Date();

        // Fetch Config to know the exact fallback message used by AI for this tenant
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { chatConfig: true }
        });
        const chatConfig = tenant?.chatConfig as any;
        const fallbackMsg = chatConfig?.fallbackMessage || "I don't have that information right now. Would you like to speak with a human agent?";

        // ── Parallel queries ──────────────────────────────────────────────────
        const [
            totalSessions,
            liveSessions,
            waitingSessions,
            totalMessages,
            userMessages,
            agentMessages,
            blockedUsers,
            endUsers,
            sessionsInRange,
            moodStats,
            allSessionsAllTime,
            escalatedSessions,
            tokensAgg,
            storageAgg,
            totalLeads
        ] = await Promise.all([
            prisma.chatSession.count({ where: { tenantId, createdAt: { gte: since } } }),
            prisma.chatSession.count({ where: { tenantId, status: 'live_agent', createdAt: { gte: since } } }),
            prisma.chatSession.count({ where: { tenantId, status: 'waiting_for_agent', createdAt: { gte: since } } }),
            prisma.chatMessage.count({ where: { session: { tenantId }, createdAt: { gte: since } } }),
            prisma.chatMessage.count({ where: { session: { tenantId }, role: 'user', createdAt: { gte: since } } }),
            prisma.chatMessage.count({ where: { session: { tenantId }, role: 'assistant', createdAt: { gte: since } } }),
            prisma.endUser.count({ where: { tenantId, isBlocked: true } }),
            prisma.endUser.findMany({ where: { tenantId }, select: { externalId: true } }),
            prisma.chatSession.findMany({
                where: { tenantId, createdAt: { gte: since } },
                select: { createdAt: true, endUserId: true },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.chatSession.groupBy({
                by: ['currentMood'],
                where: { tenantId, currentMood: { not: null }, createdAt: { gte: since } },
                _count: { _all: true },
            }),
            // All sessions for peak hours (filtered by range)
            prisma.chatSession.findMany({
                where: { tenantId, createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            prisma.chatSession.count({
                where: {
                    tenantId,
                    createdAt: { gte: since },
                    messages: { some: { role: 'system' } }
                }
            }),
            prisma.chatMessage.aggregate({
                where: { session: { tenantId }, createdAt: { gte: since } },
                _sum: { tokensUsed: true }
            }),
            prisma.knowledgeChunk.aggregate({
                where: { tenantId }, // Total Storage is absolute, not date-bound
                _sum: { byteSize: true }
            }),
            prisma.lead.count({ where: { tenantId, createdAt: { gte: since } } })
        ]);

        // ── Platform breakdown ────────────────────────────────────────────────
        let widget = 0, messenger = 0, whatsapp = 0;
        for (const u of endUsers) {
            const id = u.externalId || '';
            if (id.startsWith('messenger-')) messenger++;
            else if (id.startsWith('wa_')) whatsapp++;
            else widget++;
        }

        // ── Build chart buckets based on range ────────────────────────────────
        let chartData: { label: string; sessions: number }[] = [];

        if (range === '1d') {
            // 24 hourly buckets
            const hourMap: number[] = Array(24).fill(0);
            for (const s of sessionsInRange) {
                const h = s.createdAt.getHours(); // local hours
                hourMap[h]++;
            }
            const nowH = now.getHours();
            // Show last 24 hours in order
            chartData = Array.from({ length: 24 }, (_, i) => {
                const h = (nowH - 23 + i + 24) % 24;
                return {
                    label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
                    sessions: hourMap[h],
                };
            });
        } else {
            // daily buckets
            const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
            const dayMap: Record<string, number> = {};
            for (let i = 0; i < days; i++) {
                const d = new Date(since);
                d.setDate(since.getDate() + i);
                dayMap[d.toISOString().slice(0, 10)] = 0;
            }
            for (const s of sessionsInRange) {
                const key = s.createdAt.toISOString().slice(0, 10);
                if (dayMap[key] !== undefined) dayMap[key]++;
            }
            chartData = Object.entries(dayMap).map(([date, count]) => ({
                label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                    ...(range === '90d' ? {} : {})
                }),
                sessions: count,
            }));
        }

        // ── Peak hours (hour of day in local time for selected range) ─────────
        const hourMap: number[] = Array(24).fill(0);
        for (const s of allSessionsAllTime) {
            const hour = s.createdAt.getUTCHours();
            hourMap[hour]++;
        }
        const peakHoursData = hourMap.map((count, hour) => ({
            hour,
            label: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
            sessions: count,
        }));

        // ── Top Questions (Keywords from User Messages) ───────────────────────
        const allUserMessages = await prisma.chatMessage.findMany({
            where: {
                session: { tenantId },
                role: 'user',
                createdAt: { gte: since }
            },
            select: { content: true }
        });

        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'and', 'to', 'for', 'of', 'with', 'it', 'that', 'this', 'you', 'i', 'my', 'how', 'what', 'where', 'when', 'why', 'can', 'do', 'does', 'are', 'am', 'please', 'hi', 'hello', 'hey']);
        const wordCounts: Record<string, number> = {};

        for (const msg of allUserMessages) {
            if (!msg.content) continue;
            // Clean punctuation and lowercase
            const words = msg.content.toLowerCase().replace(/[^\w\s-]/g, '').split(/\s+/);
            for (const w of words) {
                if (w.length > 2 && !stopWords.has(w) && !Number.isFinite(Number(w))) {
                    wordCounts[w] = (wordCounts[w] || 0) + 1;
                }
            }
        }

        const topQuestions = Object.entries(wordCounts)
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // ── Top Unanswered Questions ──────────────────────────────────────────
        // Find recent assistant messages that exactly match the fallback message
        const fallbackReplies = await prisma.chatMessage.findMany({
            where: {
                session: { tenantId },
                role: 'assistant',
                content: { contains: fallbackMsg.substring(0, Math.min(fallbackMsg.length, 40)) },
                createdAt: { gte: since }
            },
            select: { sessionId: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });

        // For each fallback reply, find the immediately preceding user message
        const unansweredCounts: Record<string, number> = {};
        for (const reply of fallbackReplies) {
            const userMsg = await prisma.chatMessage.findFirst({
                where: {
                    sessionId: reply.sessionId,
                    role: 'user',
                    createdAt: { lt: reply.createdAt }
                },
                orderBy: { createdAt: 'desc' },
                select: { content: true }
            });

            if (userMsg && userMsg.content) {
                // simple normalization to group similar exact strings
                const text = userMsg.content.trim().toLowerCase();
                // only count reasonable length queries, not random characters
                if (text.length > 2 && text.length < 150) {
                    unansweredCounts[text] = (unansweredCounts[text] || 0) + 1;
                }
            }
        }

        // Sort and get top 5
        const topUnanswered = Object.entries(unansweredCounts)
            .map(([question, count]) => ({ question, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);


        res.json({
            overview: {
                totalSessions,
                liveSessions,
                waitingSessions,
                aiSessions: totalSessions - escalatedSessions,
                totalMessages,
                userMessages,
                agentMessages,
                blockedUsers,
                totalUsers: endUsers.length,
                escalatedSessions,
                totalTokensUsed: tokensAgg._sum.tokensUsed || 0,
                estimatedCostUsd: parseFloat((((tokensAgg._sum.tokensUsed || 0) / 1000) * 0.002).toFixed(4)),
                storageBytesUsed: storageAgg._sum.byteSize || 0,
                totalLeads,
                leadConversionRate: totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0
            },
            chartData,               // unified chart (hourly for 1d, daily for rest)
            moodDistribution: moodStats.map(m => ({
                mood: m.currentMood || 'unknown',
                count: m._count._all,
            })),
            platformBreakdown: { widget, messenger, whatsapp },
            peakHoursData,
            topUnanswered,
            topQuestions,
            range,
        });
    } catch (err) {
        console.error('[Analytics] Error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

export default router;
