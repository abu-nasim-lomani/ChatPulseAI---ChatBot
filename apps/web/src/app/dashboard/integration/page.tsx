"use client";

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Copy, Check, ExternalLink, Settings, Code, Zap } from 'lucide-react';
import Link from 'next/link';

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 mb-2">
                        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
                        <span>/</span>
                        <span className="text-gray-900">Integration</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Your Chatbot</h1>
                    <p className="text-gray-500 text-xs mt-1">Install the widget on your website to start chatting with visitors.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-2">
                        <Zap size={10} className="fill-current" />
                        Tenant ID: {user.tenantId?.substring(0, 8)}...
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Installation Code */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                    <Code size={16} />
                                </div>
                                <h2 className="text-sm font-bold text-gray-900">Installation Code</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                Copy and paste this code snippet before the closing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono text-[10px]">&lt;/body&gt;</code> tag of every page where you want the chatbot to appear.
                            </p>

                            <div className="relative group">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={handleCopy}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-medium shadow-sm transition-all flex items-center gap-1.5 ${copied ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={12} />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                Copy Code
                                            </>
                                        )}
                                    </button>
                                </div>
                                <pre className="bg-slate-900 text-slate-300 p-5 rounded-lg text-[10px] overflow-x-auto font-mono leading-relaxed shadow-inner border border-slate-800">
                                    <div className="flex">
                                        <div className="flex-none w-8 text-slate-600 select-none text-right pr-3 border-r border-slate-800 mr-3">
                                            1<br />2<br />3<br />4<br />5<br />6<br />7
                                        </div>
                                        <code>
                                            <span className="text-slate-500">&lt;!-- Chatbot Widget Embed Code --&gt;</span><br />
                                            <span className="text-blue-400">&lt;script&gt;</span><br />
                                            {'  '}window.<span className="text-yellow-400">ChatbotConfig</span> = {'{'}<br />
                                            {'    '}apiKey: <span className="text-green-400">&quot;{user.tenantId}&quot;</span><br />
                                            {'  '}{'};'}<br />
                                            <span className="text-blue-400">&lt;/script&gt;</span><br />
                                            <span className="text-blue-400">&lt;script</span> src=<span className="text-green-400">&quot;{WIDGET_URL}&quot;</span> defer<span className="text-blue-400">&gt;&lt;/script&gt;</span>
                                        </code>
                                    </div>
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
                        <div className="mt-0.5 min-w-4 text-amber-500">
                            <Zap size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-800 mb-1">Verify Installation</h4>
                            <p className="text-[10px] text-amber-700 leading-relaxed">
                                After adding the code, verify your installation by visiting your website. The widget should verify itself automatically within a few minutes of the first load.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="space-y-5">

                    {/* Test Live Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-green-500/30 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ExternalLink size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ExternalLink size={18} />
                            </div>
                            <h3 className="text-xs font-bold text-gray-900">Test It Live</h3>
                            <p className="text-[10px] text-gray-500 mt-1 mb-4">Preview on a demo page without installing code.</p>

                            <a
                                href={`/test-widget?tenantId=${user.tenantId}`}
                                target="_blank"
                                className="inline-flex items-center text-[10px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors gap-2"
                            >
                                Open Test Page <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>

                    {/* Customization Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-purple-500/30 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Settings size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Settings size={18} />
                            </div>
                            <h3 className="text-xs font-bold text-gray-900">Customization</h3>
                            <p className="text-[10px] text-gray-500 mt-1 mb-4">Change colors, icons, and behavior.</p>

                            <button
                                disabled
                                className="inline-flex items-center text-[10px] font-semibold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg cursor-not-allowed gap-2"
                            >
                                Customize Widget <span className="text-[9px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">Soon</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
