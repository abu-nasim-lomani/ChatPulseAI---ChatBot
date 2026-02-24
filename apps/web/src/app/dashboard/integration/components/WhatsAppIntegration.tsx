'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Check, Copy, Link2, Key, Info } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function WhatsAppIntegration({ tenantId }: { tenantId: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('loading');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [connectedPhoneId, setConnectedPhoneId] = useState('');
    const [copied, setCopied] = useState(false);

    const webhookUrl = `${API_URL}/webhooks/whatsapp`.replace('localhost', 'your-domain.ngrok.dev'); // Helper text

    useEffect(() => {
        if (!tenantId) return;

        const checkStatus = async () => {
            try {
                const res = await axios.get(`${API_URL}/integrations/whatsapp/${tenantId}`);
                if (res.data.connected) {
                    setStatus('connected');
                    setConnectedPhoneId(res.data.phoneNumberId);
                } else {
                    setStatus('idle');
                }
            } catch (error) {
                console.error('Failed to fetch whatsapp status', error);
                setStatus('error');
            }
        };

        checkStatus();
    }, [tenantId]);

    const handleConnect = async () => {
        if (!phoneNumberId || !accessToken) return;

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/integrations/whatsapp`, {
                tenantId,
                phoneNumberId,
                accessToken
            });
            setStatus('connected');
            setConnectedPhoneId(phoneNumberId);
        } catch (error) {
            console.error('Failed to connect whatsapp', error);
            setStatus('error');
            alert('Failed to save WhatsApp configuration.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/integrations/whatsapp/disconnect`, { tenantId });
            setStatus('idle');
            setPhoneNumberId('');
            setAccessToken('');
            setConnectedPhoneId('');
        } catch (error) {
            console.error('Failed to disconnect whatsapp', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'loading') {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-green-50/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366] shadow-sm border border-[#25D366]/20">
                        <MessageCircle size={20} className="fill-current text-[#25D366]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">WhatsApp Cloud API</h2>
                        <p className="text-[10px] text-gray-500 mt-0.5">Connect your official WhatsApp Business Number</p>
                    </div>
                </div>
                {status === 'connected' && (
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Active
                    </span>
                )}
            </div>

            <div className="p-6 flex flex-col gap-6">
                {status === 'connected' ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100/50">
                            <p className="text-xs text-green-800 font-medium">
                                Successfully linked to Phone ID: <span className="font-bold">{connectedPhoneId}</span>
                            </p>
                            <p className="text-[11px] text-green-700/80 mt-1">
                                Your AI is now actively listening for incoming WhatsApp messages.
                            </p>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 px-4 py-2 text-xs font-bold rounded-xl transition-all w-fit"
                        >
                            Disconnect Number
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">

                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-2">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-900 mb-1">Manual Configuration Required</p>
                                    <p className="text-[10px] text-amber-700 leading-relaxed">
                                        Due to Meta&apos;s API restrictions, you must manually create a Meta App and generate a <strong>Permanent System User Token</strong>. Ensure your app is configured with the webhook URL below.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-2 mb-1.5">
                                    <Key size={12} className="text-gray-400" /> Phone Number ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1029384756"
                                    value={phoneNumberId}
                                    onChange={(e) => setPhoneNumberId(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-200 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-2 mb-1.5">
                                    <Key size={12} className="text-gray-400" /> Permanent Access Token
                                </label>
                                <input
                                    type="password"
                                    placeholder="EAAGm0PX4ZCQoBO..."
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-200 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]"
                                />
                            </div>
                        </div>

                        <div className="mt-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-2 mb-1.5">
                                <Link2 size={12} className="text-gray-400" /> Your Webhook URL
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                    <code className="text-xs text-gray-600 font-mono truncate flex-1">
                                        {webhookUrl}
                                    </code>
                                    <button onClick={copyWebhook} className="flex-none p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500">
                                    Verify Token: <code className="bg-gray-100 px-1 rounded">whatsapp_verify_123</code>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={!phoneNumberId || !accessToken || isSubmitting}
                            className={`mt-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${(!phoneNumberId || !accessToken || isSubmitting) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#20bd5a] hover:shadow-md hover:-translate-y-0.5'}`}
                        >
                            {isSubmitting ? 'Connecting...' : 'Connect WhatsApp'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
