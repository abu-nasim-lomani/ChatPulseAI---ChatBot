"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { MessageSquare, Zap, Book, ArrowUpRight, ShieldCheck, Cpu, Database, Users } from 'lucide-react';
import axios from 'axios';

export default function DashboardHome() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user?.tenantId) {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            axios.get(`${API_URL}/analytics/${user.tenantId}?range=30d`)
                .then(res => setStats(res.data.overview))
                .catch(err => console.error("Failed to fetch dashboard stats", err));
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 mb-2">
                        <span>Home</span>
                        <span>/</span>
                        <span className="text-gray-900">Dashboard</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
                    <p className="text-gray-500 text-xs mt-1">Welcome back, here&apos;s what&apos;s happening with your AI assistant.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        Last updated: Just now
                    </span>
                    <Link href="/dashboard/settings" className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-lg shadow-gray-200">
                        <Zap size={14} />
                        <span>New Bot</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="Total Sessions"
                    value={stats.totalSessions.toLocaleString()}
                    change="Last 30 Days"
                    icon={MessageSquare}
                />
                <StatCard
                    title="Total Messages"
                    value={stats.totalMessages.toLocaleString()}
                    change="Last 30 Days"
                    icon={Book}
                />
                <StatCard
                    title="AI Handled"
                    value={stats.aiSessions.toLocaleString()}
                    change="vs Human Esc."
                    icon={Zap}
                />
                <StatCard
                    title="Lead Conversion Rate"
                    value={stats.leadConversionRate ? stats.leadConversionRate.toFixed(1) + '%' : '0%'}
                    change={`${stats.totalLeads} Total Leads`}
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Bot Performance Chart Placeholder */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Bot Performance</h3>
                                <p className="text-[10px] text-gray-500">Inquiries handled over time</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="text-[10px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">7d</button>
                                <button className="text-[10px] font-medium px-2 py-1 rounded text-gray-500 hover:bg-gray-50 transition-colors">30d</button>
                            </div>
                        </div>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-2">
                                <ShieldCheck size={14} />
                                Chart Visualization Placeholder
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Quick Action: Messages */}
                        <Link href="/dashboard/chat" className="group block">
                            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-indigo-500/30 hover:shadow-md transition-all h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <MessageSquare size={80} />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                        <MessageSquare size={18} />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900">Customer Messages</h3>
                                    <p className="text-[10px] text-gray-500 mt-1 mb-4">View and reply to inquiries.</p>
                                    <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Open Inbox <ArrowUpRight size={10} />
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Quick Action: Knowledge */}
                        <Link href="/dashboard/knowledge" className="group block">
                            <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-pink-500/30 hover:shadow-md transition-all h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Book size={80} />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                        <Book size={18} />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900">Knowledge Base</h3>
                                    <p className="text-[10px] text-gray-500 mt-1 mb-4">Train your AI with sources.</p>
                                    <span className="text-[10px] font-semibold text-pink-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Manage Sources <ArrowUpRight size={10} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Activity Feed</h3>
                            <button className="text-[10px] text-gray-400 hover:text-gray-600">View All</button>
                        </div>
                        <div className="p-4">
                            <div className="relative pl-4 border-l border-gray-100 space-y-6">

                                <div className="relative group">
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-medium mb-0.5">2 mins ago</span>
                                        <p className="text-xs font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">Knowledge Source Added</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">pricing_v2.pdf processed</p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white group-hover:bg-slate-400 transition-colors"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-medium mb-0.5">45 mins ago</span>
                                        <p className="text-xs font-medium text-gray-800">Bot Settings Updated</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Changed temperature to 0.7</p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white group-hover:bg-slate-400 transition-colors"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-medium mb-0.5">3 hours ago</span>
                                        <p className="text-xs font-medium text-gray-800">Integration Connected</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Slack integration enabled</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Usage Metrics */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        {/* Decorative background accent */}
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-100 transition-colors"></div>

                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Resource Usage</h3>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Enterprise Tier Limits</p>
                            </div>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Cpu size={16} />
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {/* AI Model Tokens */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={12} className="text-gray-400" />
                                        <span className="text-xs font-semibold text-gray-700">AI Model Tokens</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div>
                                            <span className="text-sm font-bold text-gray-900">{stats.totalTokensUsed.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400 ml-1">/ 500k limit</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-50 rounded-full h-2.5 outline outline-1 outline-gray-100 overflow-hidden mb-1.5">
                                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full shadow-inner" style={{ width: `${Math.min((stats.totalTokensUsed / 500000) * 100, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 shadow-sm">Est. API Cost: ${stats.estimatedCostUsd !== undefined ? stats.estimatedCostUsd.toFixed(4) : '0.000'}</span>
                                    <p className="text-[10px] text-gray-400 font-medium">API Usage (GPT-4o)</p>
                                </div>
                            </div>

                            {/* Knowledge DB Storage */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Database size={12} className="text-gray-400" />
                                        <span className="text-xs font-semibold text-gray-700">Knowledge DB Storage</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-gray-900">{(stats.storageBytesUsed / (1024 * 1024)).toFixed(2)} MB</span>
                                        <span className="text-[10px] text-gray-400 ml-1">/ 50 MB limit</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-50 rounded-full h-2.5 outline outline-1 outline-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 h-2.5 rounded-full shadow-inner" style={{ width: `${Math.min((stats.storageBytesUsed / (50 * 1024 * 1024)) * 100, 100)}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5 text-right font-medium">Vector Memory Capacity</p>
                            </div>
                        </div>
                    </div>

                    {/* System Status Mini */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">System Operational</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500">API Latency</span>
                                <span className="font-mono text-gray-700">45ms</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full w-[30%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = ({ title, value, change, icon: Icon }: { title: string, value: string, change: string, icon: any }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
            <Icon size={120} />
        </div>
        <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{title}</h3>
            <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1 relative z-10">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{value}</span>
        </div>
        <div className="flex items-center text-[10px] font-medium text-gray-500 relative z-10">
            <span className="text-gray-400 font-medium">{change}</span>
        </div>
    </div>
);
