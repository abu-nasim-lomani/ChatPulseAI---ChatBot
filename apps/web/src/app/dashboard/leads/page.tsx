"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Mail, Phone, Building2, Search, ArrowUpDown, Calendar, Clock } from 'lucide-react';

interface Lead {
    id: string;
    tenantId: string;
    sessionId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    customData: Record<string, unknown> | null;
    source: string;
    createdAt: string;
}

export default function LeadsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!user?.tenantId) return;

        const fetchLeads = async () => {
            try {
                const axios = (await import('axios')).default;

                // We use passing the tenantId since that is how the backend route was built
                // We're omitting Authorization header since /tenants/leads is currently unprotected on the backend
                const res = await axios.get(`${API_URL}/tenants/leads?tenantId=${user.tenantId}`);

                if (res.data && res.data.leads) {
                    setLeads(res.data.leads);
                }
            } catch (err) {
                console.error("Failed to load leads", err);
                setError('Failed to load your collected leads.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
    }, [user, API_URL]);

    const filteredLeads = leads.filter(lead => {
        const search = searchTerm.toLowerCase();
        return (
            (lead.name && lead.name.toLowerCase().includes(search)) ||
            (lead.email && lead.email.toLowerCase().includes(search)) ||
            (lead.company && lead.company.toLowerCase().includes(search)) ||
            (lead.phone && lead.phone.includes(search))
        );
    });

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 pt-2">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50/50 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">Collected Leads</h1>
                            <p className="text-slate-500 text-[15px]">View and manage contacts captured by your chatbot.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] border-t border-slate-200 mb-8"></div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100/50 text-sm">
                    {error}
                </div>
            )}

            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">

                {/* Search */}
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search leads by name, email, or company..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto text-sm text-slate-500 font-medium px-2">
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md">{leads.length}</span> Total Leads
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 rounded-tl-2xl">
                                    <div className="flex items-center justify-between hover:text-slate-800 cursor-pointer group">
                                        Contact Info <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Additional Info</th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center justify-between hover:text-slate-800 cursor-pointer group">
                                        Captured On <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50/50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold uppercase text-sm">
                                                    {lead.name ? lead.name.charAt(0) : (lead.email ? lead.email.charAt(0) : '?')}
                                                </div>
                                                <div className="flex flex-col min-w-[120px]">
                                                    <span className="text-[14px] font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {lead.name || 'Anonymous User'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                                                        <Mail size={12} />
                                                        <span className="text-[13px]">{lead.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Building2 size={15} className="text-slate-400" />
                                                <span className="text-sm font-medium">{lead.company || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Phone size={15} className="text-slate-400" />
                                                <span className="text-sm">{lead.phone || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            {lead.customData && Object.keys(lead.customData).length > 0 ? (
                                                <div className="flex flex-col gap-1.5 max-w-[200px]">
                                                    {Object.entries(lead.customData).map(([key, value]) => (
                                                        <div key={key} className="text-[12px] bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                                            <span className="font-semibold text-slate-600 block">{key}:</span>
                                                            <span className="text-slate-500 break-words">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex flex-col text-slate-600 gap-1">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Calendar size={13} className="text-slate-400" />
                                                    {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                                                    <Clock size={12} />
                                                    {new Date(lead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                New
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Users size={24} className="text-slate-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-900 mb-1">No leads found</h3>
                                            <p className="text-sm text-slate-500 max-w-sm">
                                                {searchTerm ? 'We couldn\'t find any leads matching your search.' : 'You haven\'t captured any leads yet. Make sure Lead Capture is enabled in your Widget Settings.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
