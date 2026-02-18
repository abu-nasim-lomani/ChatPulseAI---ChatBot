"use client";
import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    Settings, Bot, Brain, Thermometer, Zap, Lightbulb,
    Save, RotateCcw, CheckCircle, AlertCircle, X,
    MessageSquare, Clock, Target, Palette, Loader2, Info
} from 'lucide-react';

const PRESETS = [
    {
        name: "Expert Support",
        icon: "🎧",
        description: "Professional customer support agent",
        prompt: `You are an expert AI customer support agent.
Your goal is to provide accurate, helpful, and concise answers based STRICTLY on the provided context.

Guidelines:
1. Use ONLY the provided context to answer. Do not make up information.
2. If the answer is not in the context, politely say: "I don't have that information right now. Would you like to speak with a human agent?"
3. Keep answers short (2-3 sentences max) unless a detailed explanation is needed.
4. Be professional, friendly, and empathetic.`
    },
    {
        name: "Sales Representative",
        icon: "💼",
        description: "Persuasive and enthusiastic sales agent",
        prompt: `You are a persuasive and enthusiastic Sales Representative.
Your goal is to highlight the benefits of our products and encourage users to sign up or learn more.

Guidelines:
1. Focus on value propositions and key features.
2. Be energetic and convincing but not pushy.
3. Always end with a call to action (e.g., "Would you like to see a demo?").
4. Use emojis to make the conversation lively. 🚀`
    },
    {
        name: "Funny Pirate",
        icon: "🏴‍☠️",
        description: "Helpful assistant with pirate persona",
        prompt: `You are a funny pirate assistant. 🏴‍☠️
Your goal is to help users while maintaining a humorous pirate persona.

Guidelines:
1. Always start with "Ahoy!" or "Avast ye!".
2. Use pirate slang (matey, treasure, ship).
3. Be helpful but stay in character.
4. If you don't know something, say "The map be faded on that one!"`
    },
    {
        name: "Natural Banglish",
        icon: "🇧🇩",
        description: "Friendly Dhaka-style Banglish agent",
        prompt: `You are a friendly customer service agent named "Rafi". You speak natural Banglish (Bengali in English letters) just like a young person from Dhaka.

Tone: Friendly, Helpful, Casual but Polite.

IMPORTANT: NEVER speak Chinese, Mandarin, or any other language. ONLY English and Banglish.

Language Rules:
1. Mix English and Bangla naturally (e.g., "Actually eta khub valo product").
2. Use words like "Bhai", "Apu", "Sir", "Mam" appropriately.
3. Don't be robotic. Write like you are chatting on WhatsApp.
4. Use emojis! 😊`
    }
];

export default function BotSettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [systemPrompt, setSystemPrompt] = useState('');
    const [memoryType, setMemoryType] = useState<'count' | 'time'>('count');
    const [memoryValue, setMemoryValue] = useState<number>(10);
    const [temperature, setTemperature] = useState<number>(0.7);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const tenantId = user?.tenantId;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

    const fetchSettings = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/tenants/settings?tenantId=${tenantId}`);
            setSystemPrompt(res.data.systemPrompt || PRESETS[0].prompt);
            if (res.data.chatConfig) {
                setMemoryType(res.data.chatConfig.memoryType || 'count');
                setMemoryValue(res.data.chatConfig.memoryValue || 10);
                setTemperature(res.data.chatConfig.temperature ?? 0.7);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, tenantId]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const handleSave = async () => {
        if (!tenantId) return;
        setIsSaving(true);
        setMessage(null);
        try {
            await axios.patch(`${apiUrl}/tenants/settings`, {
                tenantId, systemPrompt,
                chatConfig: { memoryType, memoryValue, temperature }
            });
            setMessage({ text: 'Bot settings updated successfully!', type: 'success' });
        } catch (error) {
            console.error('Failed to update settings:', error);
            let errorMsg = 'Failed to update settings.';
            if (axios.isAxiosError(error) && error.response?.data) {
                const axiosError = error as AxiosError<{ error?: string; details?: string }>;
                if (axiosError.response?.data) {
                    const data = axiosError.response.data;
                    errorMsg = data.error || data.details || errorMsg;
                }
            }
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const tempLabel = temperature < 0.4 ? 'Focused' : temperature < 0.8 ? 'Balanced' : 'Creative';
    const tempColor = temperature < 0.4 ? 'text-blue-600' : temperature < 0.8 ? 'text-indigo-600' : 'text-orange-500';

    return (
        <div className="flex flex-col h-[calc(100vh-2.5rem)] md:h-[calc(100vh-4.5rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans text-gray-900">

            {/* Page Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Settings size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight">Bot Settings</h1>
                        <p className="text-[11px] text-gray-500">Configure your AI&apos;s personality, tone, and behavior</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSettings}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                    >
                        <RotateCcw size={13} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isSaving
                            ? 'bg-indigo-400 text-white cursor-wait'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        {isSaving
                            ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                            : <><Save size={13} /> Save Changes</>
                        }
                    </button>
                </div>
            </div>

            {/* Toast */}
            {message && (
                <div className={`mx-6 mt-4 flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5 border shadow-sm ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border-green-100'
                    : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                    {message.type === 'success'
                        ? <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                        : <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                    }
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Main Settings */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* System Prompt */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot size={15} className="text-indigo-600" />
                                <h2 className="text-sm font-bold text-gray-800">System Prompt</h2>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {systemPrompt.length} chars
                            </span>
                        </div>
                        <div className="relative">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-56 bg-gray-50">
                                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                                </div>
                            ) : (
                                <textarea
                                    className="w-full h-56 p-5 resize-none focus:outline-none font-mono text-xs leading-relaxed text-gray-800 bg-white placeholder-gray-400"
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Enter your system instructions here..."
                                    spellCheck={false}
                                />
                            )}
                        </div>
                    </div>

                    {/* Memory Configuration */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Brain size={15} className="text-indigo-600" />
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Chat Memory</h3>
                                <p className="text-[10px] text-gray-500">Control how much conversation history the AI remembers</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-5">
                            {/* Memory Type */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2.5 block">Memory Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'count' as const, icon: <MessageSquare size={18} />, label: 'Message Count', desc: 'Remember last N messages' },
                                        { id: 'time' as const, icon: <Clock size={18} />, label: 'Time Duration', desc: 'Remember from last N hours' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setMemoryType(opt.id)}
                                            className={`p-4 border-2 rounded-xl transition-all text-left ${memoryType === opt.id
                                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`mb-2 ${memoryType === opt.id ? 'text-indigo-600' : 'text-gray-400'}`}>{opt.icon}</div>
                                            <div className="text-xs font-bold text-gray-800">{opt.label}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Memory Value */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                    {memoryType === 'count' ? 'Number of Messages' : 'Hours to Remember'}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max={memoryType === 'count' ? '100' : '720'}
                                        value={memoryValue}
                                        onChange={(e) => setMemoryValue(parseInt(e.target.value) || 1)}
                                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                                    />
                                    <span className="text-xs font-semibold text-gray-500 w-16">
                                        {memoryType === 'count' ? 'messages' : 'hours'}
                                    </span>
                                </div>
                                {memoryType === 'time' && (
                                    <div className="flex gap-2 mt-2.5 flex-wrap">
                                        {[{ label: '1 Day', val: 24 }, { label: '3 Days', val: 72 }, { label: '7 Days', val: 168 }].map(p => (
                                            <button
                                                key={p.val}
                                                onClick={() => setMemoryValue(p.val)}
                                                className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg transition border ${memoryValue === p.val
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-3 bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
                                <Info size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-indigo-700">
                                    AI will remember {memoryType === 'count'
                                        ? `the last ${memoryValue} messages`
                                        : `all messages from the last ${memoryValue} hours${memoryValue >= 24 ? ` (~${Math.floor(memoryValue / 24)} days)` : ''}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Temperature */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Thermometer size={15} className="text-indigo-600" />
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">AI Temperature</h3>
                                <p className="text-[10px] text-gray-500">Control response creativity vs consistency</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-semibold text-gray-600">Temperature Value</label>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold ${tempColor}`}>{tempLabel}</span>
                                        <span className={`text-xl font-bold ${tempColor}`}>{temperature.toFixed(1)}</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                                    <span>0.0 · Precise</span>
                                    <span>0.5 · Balanced</span>
                                    <span>1.0 · Creative</span>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2.5 block">Quick Presets</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { icon: <Target size={16} />, label: 'Focused', val: 0.2, color: 'text-blue-600' },
                                        { icon: <Palette size={16} />, label: 'Balanced', val: 0.7, color: 'text-indigo-600' },
                                        { icon: <Zap size={16} />, label: 'Creative', val: 0.9, color: 'text-orange-500' },
                                    ].map(p => (
                                        <button
                                            key={p.val}
                                            onClick={() => setTemperature(p.val)}
                                            className={`p-3 border-2 rounded-xl transition-all text-center ${temperature === p.val
                                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`flex justify-center mb-1.5 ${temperature === p.val ? p.color : 'text-gray-400'}`}>{p.icon}</div>
                                            <div className="text-[10px] font-bold text-gray-800">{p.label}</div>
                                            <div className="text-[9px] text-gray-400">{p.val}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                                <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800">
                                    {temperature < 0.4
                                        ? <><strong>Low ({temperature}):</strong> Consistent, focused, deterministic. Best for factual Q&A.</>
                                        : temperature < 0.8
                                            ? <><strong>Medium ({temperature}):</strong> Balanced creativity and consistency. Recommended for most use cases.</>
                                            : <><strong>High ({temperature}):</strong> More creative and varied responses. May be less predictable.</>
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: Presets & Tips */}
                <div className="hidden lg:flex flex-col w-72 border-l border-gray-100 overflow-y-auto bg-gray-50/30">

                    {/* Presets */}
                    <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={14} className="text-indigo-600" />
                            <h3 className="text-sm font-bold text-gray-800">Quick Presets</h3>
                        </div>
                        <div className="space-y-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => setSystemPrompt(preset.prompt)}
                                    className="w-full text-left p-3 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all group hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white group-hover:bg-indigo-50 rounded-xl flex items-center justify-center text-lg shadow-sm border border-gray-100 transition flex-shrink-0">
                                            {preset.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-gray-800 group-hover:text-indigo-700 transition truncate">
                                                {preset.name}
                                            </div>
                                            <div className="text-[10px] text-gray-400 truncate">{preset.description}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="p-5">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb size={16} className="text-indigo-200" />
                                    <h3 className="font-bold text-sm">Pro Tips</h3>
                                </div>
                                <ul className="space-y-2.5 text-xs text-indigo-100">
                                    <li className="flex gap-2">
                                        <span className="text-indigo-300 flex-shrink-0">•</span>
                                        Be specific about what the AI should NOT do.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-300 flex-shrink-0">•</span>
                                        Define the tone (e.g., &quot;Professional&quot;, &quot;Friendly&quot;).
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-300 flex-shrink-0">•</span>
                                        Use numbered rules to organize complex instructions.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-300 flex-shrink-0">•</span>
                                        Lower temperature for factual support bots.
                                    </li>
                                </ul>
                            </div>
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-20 h-20 bg-purple-400 opacity-20 rounded-full blur-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
