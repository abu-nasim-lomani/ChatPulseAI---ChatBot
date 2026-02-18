"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function TestWidgetContent() {
    const searchParams = useSearchParams();
    const tenantId = searchParams.get('tenantId');
    // Initialize status based on tenantId presence to avoid sync effect
    const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>(tenantId ? 'loading' : 'missing');

    useEffect(() => {
        if (!tenantId) return;

        // Set Config
        // @ts-expect-error - ChatbotConfig is defined on window in widget.js
        window.ChatbotConfig = { apiKey: tenantId };

        // Load Script
        const script = document.createElement('script');
        script.src = "/widget.js"; // Loads from public/widget.js
        script.defer = true;
        script.onload = () => setStatus('ready');
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            // Cleanup widget UI if possible (widget.js doesn't export a destroy method yet, so we just remove the button)
            const btn = document.querySelector('.sb-widget-button');
            const win = document.querySelector('.sb-chat-window');
            if (btn) btn.remove();
            if (win) win.remove();
        }
    }, [tenantId]);

    if (status === 'missing') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Missing Tenant ID</h1>
                    <p className="text-gray-600 mb-6">
                        Please provides a <code>tenantId</code> parameter in the URL.
                    </p>
                    <a href="/dashboard/integration" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                        Chatbot Playground 🧪
                    </h1>
                    <p className="text-lg text-gray-600">
                        Test your AI assistant in a safe environment.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="bg-green-100 text-green-600 p-1.5 rounded-lg text-sm">✅</span>
                        Testing Checklist
                    </h2>

                    <ul className="space-y-4 text-gray-700">
                        <li className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold">1</div>
                            <div>
                                <strong className="block text-gray-900">Locate the Widget</strong>
                                <span className="text-sm text-gray-500">Look for the floating button in the bottom-right corner.</span>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold">2</div>
                            <div>
                                <strong className="block text-gray-900">Start a Conversation</strong>
                                <span className="text-sm text-gray-500">Click to open and verify the welcome message loads.</span>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold">3</div>
                            <div>
                                <strong className="block text-gray-900">Ask a Question</strong>
                                <span className="text-sm text-gray-500">Try saying &quot;Hello&quot; or ask about your business.</span>
                            </div>
                        </li>
                    </ul>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
                        <div className="text-gray-500">
                            Status: <span className="font-medium text-green-600">Widget Active</span>
                        </div>
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Tenant: {tenantId?.slice(0, 8)}...
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a href="/dashboard/integration" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        &larr; Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function TestWidgetPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading test environment...</div>}>
            <TestWidgetContent />
        </Suspense>
    );
}
