"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    MessageSquare, Users, Headphones, Bot, Clock,
    TrendingUp, BarChart2, Activity, ShieldX, RefreshCw
} from 'lucide-react';

type RangeKey = '1d' | '7d' | '30d' | '90d';

interface AnalyticsData {
    overview: {
        totalSessions: number;
        liveSessions: number;
        waitingSessions: number;
        aiSessions: number;
        totalMessages: number;
        userMessages: number;
        agentMessages: number;
        blockedUsers: number;
        totalUsers: number;
        escalatedSessions: number;
    };
    chartData: { label: string; sessions: number }[];
    moodDistribution: { mood: string; count: number }[];
    platformBreakdown: { widget: number; messenger: number; whatsapp: number };
    peakHoursData: { hour: number; label: string; sessions: number }[];
    topUnanswered: { question: string; count: number }[];
    topQuestions: { keyword: string; count: number }[];
    range: string;
}

const RANGES: { key: RangeKey; label: string }[] = [
    { key: '1d', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
];

const MOOD_COLORS: Record<string, string> = {
    frustrated: '#f97316',
    furious: '#ef4444',
    neutral: '#94a3b8',
    happy: '#22c55e',
    unknown: '#d4d4d8',
};

const PLATFORM_COLORS = ['#6366f1', '#3b82f6', '#22c55e'];

const StatCard = ({
    title, value, sub, icon, color,
}: {
    title: string; value: string | number; sub?: string;
    icon: React.ReactNode; color: string;
}) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{title}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
        </div>
    </div>
);

export default function AnalyticsDashboard() {
    const { user, isLoading } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<RangeKey>('30d');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchAnalytics = async (r: RangeKey = range) => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/analytics/${user.tenantId}?range=${r}`);
            setData(res.data);
            setLastUpdated(new Date());
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading && user?.tenantId) fetchAnalytics(range);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, user?.tenantId, range]);

    const handleRangeChange = (r: RangeKey) => {
        setRange(r);
    };

    const platformData = data ? [
        { name: 'Widget', value: data.platformBreakdown.widget },
        { name: 'Messenger', value: data.platformBreakdown.messenger },
        { name: 'WhatsApp', value: data.platformBreakdown.whatsapp },
    ].filter(p => p.value > 0) : [];

    const chartInterval = range === '1d' ? 3 : range === '7d' ? 0 : range === '90d' ? 9 : 4;

    return (
        <div className="flex flex-col h-[calc(100vh-2.5rem)] md:h-[calc(100vh-4.5rem)] bg-gray-50/50 rounded-2xl overflow-hidden font-sans">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <BarChart2 size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-[11px] text-gray-500">
                            {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
                        </p>
                    </div>
                </div>

                {/* Range Filter Tabs + Refresh */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                        {RANGES.map(r => (
                            <button
                                key={r.key}
                                onClick={() => handleRangeChange(r.key)}
                                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${range === r.key
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => fetchAnalytics(range)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-gray-200"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-500' : ''} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {loading && !data ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Activity size={32} className="text-indigo-300 mx-auto mb-3 animate-pulse" />
                            <p className="text-gray-500 text-sm">Loading analytics...</p>
                        </div>
                    </div>
                ) : data ? (
                    <>
                        {/* ── Stat Cards ──────────────────────────────────── */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            <StatCard
                                title="Total Sessions"
                                value={data.overview.totalSessions}
                                sub={RANGES.find(r => r.key === range)?.label}
                                icon={<MessageSquare size={18} className="text-indigo-600" />}
                                color="bg-indigo-50"
                            />
                            <StatCard
                                title="Total Users"
                                value={data.overview.totalUsers}
                                sub="All time (unique)"
                                icon={<Users size={18} className="text-violet-600" />}
                                color="bg-violet-50"
                            />
                            <StatCard
                                title="Escalation Rate"
                                value={data.overview.totalSessions > 0 ? `${Math.round(((data.overview.escalatedSessions || 0) / data.overview.totalSessions) * 100)}%` : '0%'}
                                sub={`${data.overview.escalatedSessions || 0} handed to agent`}
                                icon={<Activity size={18} className="text-rose-600" />}
                                color="bg-rose-50"
                            />
                            <StatCard
                                title="Live Agent Sessions"
                                value={data.overview.liveSessions}
                                sub="Currently with agent"
                                icon={<Headphones size={18} className="text-green-600" />}
                                color="bg-green-50"
                            />
                            <StatCard
                                title="AI Sessions"
                                value={data.overview.aiSessions}
                                sub="Handled by AI"
                                icon={<Bot size={18} className="text-blue-600" />}
                                color="bg-blue-50"
                            />
                            <StatCard
                                title="Waiting"
                                value={data.overview.waitingSessions}
                                sub="Waiting for agent"
                                icon={<Clock size={18} className="text-amber-600" />}
                                color="bg-amber-50"
                            />
                            <StatCard
                                title="Total Messages"
                                value={data.overview.totalMessages}
                                sub={`${data.overview.userMessages} from users`}
                                icon={<TrendingUp size={18} className="text-teal-600" />}
                                color="bg-teal-50"
                            />
                            <StatCard
                                title="Agent Replies"
                                value={data.overview.agentMessages}
                                sub="Human agent replies"
                                icon={<ShieldX size={18} className="text-pink-600" />}
                                color="bg-pink-50"
                            />
                            <StatCard
                                title="Blocked Users"
                                value={data.overview.blockedUsers}
                                sub="Banned from chat"
                                icon={<ShieldX size={18} className="text-red-600" />}
                                color="bg-red-50"
                            />
                        </div>

                        {/* ── Main Chart + Platform ──────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* Unified sessions chart */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">
                                            Sessions — {RANGES.find(r => r.key === range)?.label}
                                        </h3>
                                        <p className="text-[10px] text-gray-400">
                                            {range === '1d' ? 'Hourly conversation volume' : 'Daily conversation volume'}
                                        </p>
                                    </div>
                                    <TrendingUp size={16} className="text-indigo-400" />
                                </div>
                                <ResponsiveContainer width="100%" height={200}>
                                    {range === '1d' ? (
                                        <BarChart data={data.chartData} barSize={14}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} interval={chartInterval} />
                                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} cursor={{ fill: '#f1f5f9' }} />
                                            <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sessions" />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={data.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} interval={chartInterval} />
                                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} labelStyle={{ fontWeight: 'bold', color: '#1e293b' }} />
                                            <Line type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ── Top FAQs (Keywords) + Platform ──────────────── */}
                        <div className="flex flex-col gap-4">

                            {/* Top Questions / Keywords */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-gray-800">Top Questions</h3>
                                    <p className="text-[10px] text-gray-400">Most mentioned by users</p>
                                </div>
                                {data.topQuestions && data.topQuestions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {data.topQuestions.map((q, i) => (
                                            <div key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100/50 flex items-center gap-1.5">
                                                <span>{q.keyword}</span>
                                                <span className="text-[10px] bg-indigo-200/50 px-1.5 py-0.5 rounded-md text-indigo-800">{q.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-20 text-gray-400 text-sm">Not enough data</div>
                                )}
                            </div>

                            {/* Platform Breakdown */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-gray-800">Platform Breakdown</h3>
                                    <p className="text-[10px] text-gray-400">Users by channel (all time)</p>
                                </div>
                                {platformData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie data={platformData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                                    {platformData.map((_, i) => (
                                                        <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="space-y-2 mt-2">
                                            {platformData.map((p, i) => (
                                                <div key={p.name} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLATFORM_COLORS[i] }} />
                                                        <span className="text-xs text-gray-600">{p.name}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-800">{p.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-20 text-gray-400 text-sm">No data yet</div>
                                )}
                            </div>
                        </div>

                        {/* ── Mood + Peak Hours + Unanswered ──────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* Top Unanswered Questions */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Top Unanswered</h3>
                                        <p className="text-[10px] text-gray-400">Questions AI couldn&apos;t answer</p>
                                    </div>
                                    <MessageSquare size={16} className="text-rose-400" />
                                </div>
                                {data.topUnanswered && data.topUnanswered.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.topUnanswered.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 p-2 rounded-xl bg-gray-50/50 border border-gray-50">
                                                <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-700 font-medium truncate">{item.question}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{item.count} times</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No unanswered questions</div>
                                )}
                            </div>

                            {/* Mood Distribution */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-gray-800">User Mood Distribution</h3>
                                    <p className="text-[10px] text-gray-400">{RANGES.find(r => r.key === range)?.label}</p>
                                </div>
                                {data.moodDistribution.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.moodDistribution.sort((a, b) => b.count - a.count).map(m => {
                                            const total = data.moodDistribution.reduce((s, x) => s + x.count, 0);
                                            const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
                                            return (
                                                <div key={m.mood}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-medium text-gray-700 capitalize">{m.mood}</span>
                                                        <span className="text-xs font-bold text-gray-500">{m.count} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: MOOD_COLORS[m.mood] || '#94a3b8' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No mood data for this period</div>
                                )}
                            </div>

                            {/* Peak Hours */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Peak Hours</h3>
                                        <p className="text-[10px] text-gray-400">When users are most active · {RANGES.find(r => r.key === range)?.label} (UTC)</p>
                                    </div>
                                    <Clock size={16} className="text-amber-400" />
                                </div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={data.peakHoursData} barSize={10}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} interval={1} />
                                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            formatter={(v: number | undefined) => [`${v ?? 0} sessions`, 'Chats']}
                                            cursor={{ fill: '#fef9c3' }}
                                        />
                                        <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
                                            {data.peakHoursData.map((entry, i) => {
                                                const max = Math.max(...data.peakHoursData.map(d => d.sessions));
                                                return (
                                                    <Cell
                                                        key={i}
                                                        fill={max > 0 && entry.sessions === max ? '#f59e0b' : max > 0 && entry.sessions >= max * 0.7 ? '#fb923c' : '#6366f1'}
                                                        opacity={entry.sessions === 0 ? 0.15 : 1}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex items-center gap-5 mt-2 justify-center">
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-400" /><span className="text-[10px] text-gray-500">Peak</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-orange-400" /><span className="text-[10px] text-gray-500">High</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /><span className="text-[10px] text-gray-500">Normal</span></div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400">Failed to load analytics</div>
                )}
            </div>
        </div >
    );
}
