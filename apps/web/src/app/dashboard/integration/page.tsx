"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Copy, Check, ExternalLink, Settings, Code, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function IntegrationPage() {
    const { user, isLoading } = useAuth();
    const [copied, setCopied] = useState(false);

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[calc(10vh-4rem)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null; // Auth wrapper in layout handles redirect

    // In production, user domain should be dynamic
    const WIDGET_URL = "http://localhost:3000/widget.js";

    const embedCode = `<!-- Chatbot Widget Embed Code -->
<script>
  window.ChatbotConfig = {
    apiKey: "${user.tenantId}"
  };
</script>
<script src="${WIDGET_URL}" defer></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-400 mb-3 uppercase">
                        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Home</Link>
                        <span className="text-slate-300">/</span>
                        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-indigo-600">Integrations</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Connect Your Chatbot</h1>
                    <p className="text-slate-500 text-sm mt-2 max-w-lg leading-relaxed">Embed the widget on your website or connect with external platforms to start engaging with visitors automatically.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50/50 p-2 border border-indigo-100/50 rounded-2xl">
                    <span className="text-xs font-mono bg-white text-indigo-700 px-4 py-2 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-2">
                        <Zap size={14} className="fill-indigo-600 text-indigo-600" />
                        <span className="text-indigo-400">Tenant:</span> {user.tenantId?.substring(0, 12)}...
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Integrations & Code */}
                <div className="lg:col-span-2 flex flex-col gap-8">

                    {/* Facebook Messenger Card */}
                    <div className="flex flex-col gap-1">
                        <Suspense fallback={<div className="animate-pulse h-64 bg-slate-50 rounded-2xl border border-slate-100"></div>}>
                            <FacebookIntegration tenantId={user.tenantId} />
                        </Suspense>
                    </div>

                    {/* Installation Code Card */}
                    <div className="flex flex-col gap-1">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                        <Code size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-900">Installation Code</h2>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Embed the widget on your HTML site.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                    Copy and paste this code snippet before the closing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono text-[10px]">&lt;/body&gt;</code> tag of every page where you want the chatbot to appear.
                                </p>

                                <div className="relative group rounded-xl overflow-hidden ring-1 ring-slate-800 shadow-sm">
                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-full flex justify-end bg-gradient-to-b from-slate-900/80 to-transparent">
                                        <button
                                            onClick={handleCopy}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md transition-all flex items-center gap-1.5 ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'}`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check size={12} strokeWidth={3} />
                                                    COPIED
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={12} />
                                                    COPY CODE
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-slate-900 text-slate-300 p-5 pt-8 text-[11px] overflow-x-auto font-mono leading-loose">
                                        <div className="flex">
                                            <div className="flex-none w-8 text-slate-600 select-none text-right pr-4 border-r border-slate-700/50 mr-4">
                                                1<br />2<br />3<br />4<br />5<br />6<br />7
                                            </div>
                                            <code>
                                                <span className="text-slate-500">&lt;!-- Chatbot Widget Embed Code --&gt;</span><br />
                                                <span className="text-pink-400">&lt;script&gt;</span><br />
                                                {'  '}window.<span className="text-cyan-400">ChatbotConfig</span> = {'{'}<br />
                                                {'    '}apiKey: <span className="text-yellow-300">&quot;{user.tenantId}&quot;</span><br />
                                                {'  '}{'};'}<br />
                                                <span className="text-pink-400">&lt;/script&gt;</span><br />
                                                <span className="text-pink-400">&lt;script</span> src=<span className="text-yellow-300">&quot;{WIDGET_URL}&quot;</span> defer<span className="text-pink-400">&gt;&lt;/script&gt;</span>
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50/80 border border-amber-100/50 rounded-xl p-4 flex items-start gap-4 mt-4">
                            <div className="mt-0.5 min-w-4 text-amber-500 p-1.5 bg-amber-100 rounded-lg shadow-sm">
                                <Zap size={14} className="fill-current" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-amber-900 mb-1">Verify Installation</h4>
                                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                                    After adding the code securely, verify your installation by visiting your website. The widget initialization sequence should trigger automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="lg:col-span-1 space-y-4">

                    {/* Test Live Card */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ExternalLink size={100} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 text-white backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                <ExternalLink size={24} />
                            </div>
                            <h3 className="text-base font-bold text-white tracking-wide">Test It Live</h3>
                            <p className="text-xs text-emerald-50 mt-1.5 mb-6 leading-relaxed">Preview your chatbot on a secure sandbox page without writing any code.</p>

                            <a
                                href={`/test-widget?tenantId=${user.tenantId}`}
                                target="_blank"
                                className="inline-flex items-center text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 px-4 py-3 rounded-xl transition-colors gap-2 shadow-sm"
                            >
                                Open Sandbox <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Customization Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                            <Settings size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:rotate-45 duration-500">
                                <Settings size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 tracking-wide">Widget Settings</h3>
                            <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">Personalize the appearance. Change colors, fonts, avatar, and behavior.</p>

                            <Link
                                href="/dashboard/settings/widget"
                                className="inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl transition-colors gap-2 cursor-pointer w-full justify-center"
                            >
                                Customize Appearance <Settings size={14} />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function FacebookIntegration({ tenantId }: { tenantId: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [fbToken, setFbToken] = useState<string>(searchParams?.get('fb_token') || '');
    const [pages, setPages] = useState<any[]>([]);
    const [selectedPage, setSelectedPage] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [pageName, setPageName] = useState(''); // Store connected page ID/name for display

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Check status
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await import('axios').then(a => a.default.get(`${API_URL}/integrations/messenger/${tenantId}`));
                if (res.data.connected) {
                    setConnected(true);
                    setPageName(res.data.pageId);
                }
            } catch (e) {
                console.error("Failed to check status", e);
            } finally {
                setChecking(false);
            }
        };
        checkStatus();
    }, [tenantId, API_URL]);

    // Fetch pages if fbToken is present
    useEffect(() => {
        if (fbToken && !connected) {
            const fetchPages = async () => {
                setLoading(true);
                try {
                    const axios = (await import('axios')).default;
                    const res = await axios.get(`${API_URL}/integrations/messenger/pages?token=${fbToken}`);
                    if (res.data.data && res.data.data.length > 0) {
                        setPages(res.data.data);
                        setSelectedPage(res.data.data[0]);
                    }
                } catch (e) {
                    console.error("Failed to fetch pages", e);
                    alert("Failed to load Facebook Pages. The token might be invalid or expired.");
                } finally {
                    setLoading(false);
                }
            }
            fetchPages();
        }
    }, [fbToken, connected, API_URL]);

    const handleLoginClick = () => {
        window.location.href = `${API_URL}/integrations/messenger/auth?tenantId=${tenantId}`;
    };

    const handleSubscribe = async () => {
        if (!selectedPage) return;
        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            await axios.post(`${API_URL}/integrations/messenger/subscribe`, {
                tenantId,
                pageId: selectedPage.id,
                pageAccessToken: selectedPage.access_token
            });
            setConnected(true);
            setPageName(selectedPage.name || selectedPage.id);
            setFbToken('');
            router.replace('/dashboard/integration'); // Clean URL
            alert('Connected successfully!');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            const errorMessage = axiosErr?.response?.data?.message || (err as Error)?.message || 'Unknown error';
            alert('Failed to connect: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect?')) return;
        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            await axios.post(`${API_URL}/integrations/messenger/disconnect`, { tenantId });
            setConnected(false);
            setPageName('');
            setFbToken('');
        } catch (err: unknown) {
            console.error(err);
            alert('Failed to disconnect');
        } finally {
            setLoading(false);
        }
    }

    if (checking) return <div className="animate-pulse h-64 bg-slate-50 rounded-2xl border border-slate-100"></div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#1877F2]/10 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1877F2] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#1877F2]/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.898 1.458 5.485 3.75 7.182V22l3.41-1.884c.895.248 1.85.384 2.84.384 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.18 11.39-3.05-3.26-5.96 3.26 6.54-6.94 3.16 3.26 5.86-3.26-6.55 6.94z"></path></svg>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Facebook Messenger</h2>
                        <p className="text-[11px] text-slate-500 font-medium">1-Click Enterprise Integration</p>
                    </div>
                </div>
                {connected && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-wide uppercase">Active</span>
                    </div>
                )}
            </div>

            <div className="p-7">
                {!connected ? (
                    <div className="space-y-5">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Connect your Facebook Page to route messages directly into this dashboard.
                            Uses securely authenticated graph API connection.
                        </p>

                        {!fbToken ? (
                            <div className="pt-2">
                                <button
                                    onClick={handleLoginClick}
                                    className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] active:bg-[#1464CD] text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.898 1.458 5.485 3.75 7.182V22l3.41-1.884c.895.248 1.85.384 2.84.384 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.18 11.39-3.05-3.26-5.96 3.26 6.54-6.94 3.16 3.26 5.86-3.26-6.55 6.94z"></path></svg>
                                    Connect with Facebook
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">Select a Page to Connect</h3>
                                {loading && pages.length === 0 ? (
                                    <div className="animate-pulse h-10 bg-slate-200 rounded-lg w-full"></div>
                                ) : (
                                    <>
                                        <select
                                            className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877F2]/20"
                                            value={selectedPage?.id || ''}
                                            onChange={(e) => {
                                                const p = pages.find(p => p.id === e.target.value);
                                                setSelectedPage(p);
                                            }}
                                        >
                                            {pages.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                            ))}
                                            {pages.length === 0 && <option disabled value="">No pages found</option>}
                                        </select>
                                        <button
                                            onClick={handleSubscribe}
                                            disabled={loading || pages.length === 0}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-transparent"></div>}
                                            {loading ? 'Subscribing...' : 'Link Selected Page'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 mb-5 flex items-start gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100 text-emerald-500 shrink-0">
                                <Check size={20} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">Successfully Linked</h3>
                                <p className="text-xs text-slate-600">
                                    Receiving messages from: <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">{pageName}</code>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-rose-600/20 border-t-rose-600"></div>}
                            {loading ? 'Disconnecting...' : 'Disconnect Page Integration'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
