"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// Extend the global Window interface to include ChatbotConfig
declare global {
    interface Window {
        ChatbotConfig?: {
            apiKey: string;
        };
    }
}

function TestWidgetContent() {
    const searchParams = useSearchParams();
    const tenantId = searchParams?.get('tenantId');

    useEffect(() => {
        if (!tenantId) return;

        // Configuration object expected by the widget
        window.ChatbotConfig = {
            apiKey: tenantId
        };

        // Load the widget script
        const script = document.createElement('script');
        script.src = '/widget.js'; // The script in public folder
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            // Clean up when unmounting (optional but good practice)
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [tenantId]);

    if (!tenantId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500">
                <p>Missing tenantId parameter in URL.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Mock Website Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            D
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Demo Corp</span>
                    </div>
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Products</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Services</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">About Us</a>
                        <a href="#" className="text-indigo-600 font-bold">Contact Support</a>
                    </nav>
                </div>
            </header>

            {/* Mock Website Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-3xl space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold tracking-wide border border-indigo-100">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Live Widget Testing Sandbox
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        See your Chatbot in action on a real website.
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                        This is a simulated webpage. The chat widget is loaded at the bottom right corner using your unique tenant ID: <code className="bg-slate-200 px-2 py-0.5 rounded text-sm font-mono text-slate-800">{tenantId}</code>
                    </p>

                    <div className="flex gap-4 pt-4">
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-all focus:ring-4 focus:ring-indigo-100">
                            Explore Features
                        </button>
                        <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-lg font-bold shadow-sm transition-all">
                            Read Documentation
                        </button>
                    </div>

                    <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-2">Test AI Replies</h3>
                            <p className="text-sm text-slate-600">Ask the bot a question related to your uploaded knowledge base documents to see how it automatically answers.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-2">Test Human Handoff</h3>
                            <p className="text-sm text-slate-600">Click the &quot;Speak to Human Agent&quot; button, then go to your dashboard live chat to respond back directly here.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function TestWidgetPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <TestWidgetContent />
        </Suspense>
    );
}
