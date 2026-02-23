"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { Save, AlertCircle, Palette, Check, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function WidgetCustomizationPage() {
    const { user, isLoading: authLoading } = useAuth();

    // Form State
    const [themeColor, setThemeColor] = useState('#4F46E5');
    const [fontColor, setFontColor] = useState('#ffffff');
    const [fontFamily, setFontFamily] = useState('Inter');
    const [widgetPosition, setWidgetPosition] = useState('bottom-right');
    const [botName, setBotName] = useState('Assistant');
    const [botAvatarType, setBotAvatarType] = useState<'emoji' | 'image'>('emoji');
    const [botAvatar, setBotAvatar] = useState('🤖');
    const [enableHumanAgent, setEnableHumanAgent] = useState(true);
    const [suggestedMessages, setSuggestedMessages] = useState('');
    const [launcherText, setLauncherText] = useState('Hey, need help? 💬');
    const [removeBranding, setRemoveBranding] = useState(false);

    // Advanced Config State
    const [autoShowDelay, setAutoShowDelay] = useState<number>(0);
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');
    const [paddingOffset, setPaddingOffset] = useState({ x: 24, y: 24 });
    const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [enableVoiceInput, setEnableVoiceInput] = useState(false);

    // Lead Capture State
    const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(false);
    const [leadCaptureTitle, setLeadCaptureTitle] = useState('Let us know how to contact you');
    const [leadCaptureName, setLeadCaptureName] = useState(true);
    const [leadCaptureEmail, setLeadCaptureEmail] = useState(true);
    const [leadCapturePhone, setLeadCapturePhone] = useState(false);
    const [leadCaptureCompany, setLeadCaptureCompany] = useState(false);
    const [leadCaptureCustomFields, setLeadCaptureCustomFields] = useState<{ id: string, label: string, required: boolean }[]>([]);

    // Request State
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Load existing settings
    useEffect(() => {
        if (!user?.tenantId) return;

        const fetchSettings = async () => {
            try {
                const axios = (await import('axios')).default;
                const res = await axios.get(`${API_URL}/tenants/settings?tenantId=${user.tenantId}`);

                const config = res.data.widgetConfig;
                if (config) {
                    if (config.themeColor) setThemeColor(config.themeColor);
                    if (config.fontColor) setFontColor(config.fontColor);
                    if (config.fontFamily) setFontFamily(config.fontFamily);
                    if (config.widgetPosition) setWidgetPosition(config.widgetPosition);
                    if (config.botName) setBotName(config.botName);
                    if (config.botAvatarType) setBotAvatarType(config.botAvatarType);
                    if (config.botAvatar) setBotAvatar(config.botAvatar);
                    if (typeof config.enableHumanAgent === 'boolean') setEnableHumanAgent(config.enableHumanAgent);
                    if (config.suggestedMessages !== undefined) setSuggestedMessages(config.suggestedMessages);
                    if (config.launcherText !== undefined) setLauncherText(config.launcherText);
                    if (typeof config.removeBranding === 'boolean') setRemoveBranding(config.removeBranding);

                    if (config.autoShowDelay !== undefined) setAutoShowDelay(config.autoShowDelay);
                    if (config.themeMode) setThemeMode(config.themeMode);
                    if (config.paddingOffset) setPaddingOffset(config.paddingOffset);
                    if (config.allowedDomains) setAllowedDomains(config.allowedDomains);
                    if (typeof config.enableVoiceInput === 'boolean') setEnableVoiceInput(config.enableVoiceInput);

                    if (typeof config.leadCaptureEnabled === 'boolean') setLeadCaptureEnabled(config.leadCaptureEnabled);
                    if (config.leadCaptureTitle !== undefined) setLeadCaptureTitle(config.leadCaptureTitle);
                    if (typeof config.leadCaptureName === 'boolean') setLeadCaptureName(config.leadCaptureName);
                    if (typeof config.leadCaptureEmail === 'boolean') setLeadCaptureEmail(config.leadCaptureEmail);
                    if (typeof config.leadCapturePhone === 'boolean') setLeadCapturePhone(config.leadCapturePhone);
                    if (typeof config.leadCaptureCompany === 'boolean') setLeadCaptureCompany(config.leadCaptureCompany);
                    if (Array.isArray(config.leadCaptureCustomFields)) setLeadCaptureCustomFields(config.leadCaptureCustomFields);
                }
            } catch (err) {
                console.error("Failed to load widget config", err);
                setError('Failed to load current settings.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [user, API_URL]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSaved(false);

        try {
            const configPayload = {
                themeColor,
                fontColor,
                fontFamily,
                widgetPosition,
                botName,
                botAvatarType,
                botAvatar,
                enableHumanAgent,
                suggestedMessages,
                launcherText,
                removeBranding,
                autoShowDelay,
                themeMode,
                paddingOffset,
                allowedDomains,
                enableVoiceInput,
                leadCaptureEnabled,
                leadCaptureTitle,
                leadCaptureName,
                leadCaptureEmail,
                leadCapturePhone,
                leadCaptureCompany,
                leadCaptureCustomFields
            };

            const axios = (await import('axios')).default;
            await axios.patch(`${API_URL}/tenants/settings`, {
                tenantId: user?.tenantId,
                widgetConfig: configPayload
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string, details?: string } } };
            const errorMessage = axiosErr?.response?.data?.details || axiosErr?.response?.data?.error || (err as Error)?.message || 'Unknown error occurred.';
            setError('Failed to save settings: ' + errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddDomain = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newDomain.trim()) {
            e.preventDefault();
            const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (!allowedDomains.includes(domain)) {
                setAllowedDomains([...allowedDomains, domain]);
            }
            setNewDomain('');
        }
    };

    const handleRemoveDomain = (domainToRemove: string) => {
        setAllowedDomains(allowedDomains.filter(d => d !== domainToRemove));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const axios = (await import('axios')).default;
            const res = await axios.post(`${API_URL}/upload/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success && res.data.url) {
                setBotAvatar(res.data.url);
                setBotAvatarType('image');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError('Failed to upload image: ' + (axiosErr?.response?.data?.error || 'Server error.'));
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 pt-2">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Home</Link>
                        <span className="text-slate-400 text-xs">&gt;</span>
                        <Link href="/dashboard/integration" className="hover:text-indigo-600 transition-colors">Integrations</Link>
                        <span className="text-slate-400 text-xs">&gt;</span>
                        <span className="text-slate-900 font-medium">Widget Customization</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50/50 rounded-2xl flex items-center justify-center">
                            <Palette className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">Widget Design</h1>
                            <p className="text-slate-500 text-[15px]">Customize your chatbot&apos;s appearance and behavior.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : <Save size={16} />}
                        {isSaving ? 'Saving Changes...' : saved ? 'Saved Successfully!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] border-t border-slate-200 mb-8"></div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100/50 text-sm mb-6">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-0 items-start">

                {/* Configuration Panel - Left Side */}
                <div className="pr-8 space-y-10 border-r border-slate-200 pb-24">

                    {/* Appearance & Branding Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Appearance & Branding</h2>

                        {/* Bot Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bot Name</label>
                            <input
                                type="text"
                                value={botName}
                                onChange={(e) => setBotName(e.target.value)}
                                className="w-full px-4 py-2.5 h-12 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                        </div>

                        {/* Avatar */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avatar</label>
                            <div className="flex items-stretch gap-3 h-16">
                                {/* Toggle */}
                                <div className="flex py-1 px-1 bg-slate-50 border border-slate-200 rounded-lg self-center h-[38px]">
                                    <button
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${botAvatarType === 'emoji' ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setBotAvatarType('emoji')}
                                    >
                                        Emoji
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${botAvatarType === 'image' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setBotAvatarType('image')}
                                    >
                                        Image
                                    </button>
                                </div>

                                {/* Upload / Input Area */}
                                <div className="flex-1 relative">
                                    {botAvatarType === 'emoji' ? (
                                        <input
                                            type="text"
                                            value={botAvatarType === 'emoji' ? botAvatar : '🤖'}
                                            onChange={(e) => setBotAvatar(e.target.value)}
                                            placeholder="🤖"
                                            maxLength={2}
                                            className="w-full h-full px-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-lg text-2xl text-center focus:outline-none focus:border-indigo-400 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-full h-full border-2 border-dashed border-indigo-200 bg-indigo-50/10 rounded-lg px-4 flex items-center justify-between relative group hover:bg-indigo-50/30 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                title="Upload Custom Image"
                                            />
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                                    {botAvatarType === 'image' && botAvatar.startsWith('http') ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={botAvatar} alt="bot avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">?</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-xs font-medium text-slate-900 truncate">bot_avatar_v2.png</span>
                                                    {botAvatarType === 'image' && botAvatar.startsWith('http') && (
                                                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                                            <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                                                                <Check size={8} className="text-white" strokeWidth={3} />
                                                            </div>
                                                            Uploaded
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded bg-slate-500/10 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Theme Color</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
                                        <input
                                            type="color"
                                            value={themeColor}
                                            onChange={(e) => setThemeColor(e.target.value)}
                                            className="absolute -top-2 -left-2 w-10 h-10 border-0 bg-transparent p-0 cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 h-12 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors uppercase"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">User Bubble Text</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
                                        <input
                                            type="color"
                                            value={fontColor}
                                            onChange={(e) => setFontColor(e.target.value)}
                                            className="absolute -top-2 -left-2 w-10 h-10 border-0 bg-transparent p-0 cursor-pointer"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={fontColor}
                                        onChange={(e) => setFontColor(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 h-12 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between pb-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Typography</label>
                                <span className="text-[10px] font-bold tracking-wide text-orange-400 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">PREMIUM</span>
                            </div>
                            <select
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value)}
                                className="w-full px-4 h-12 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none bg-white cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 1rem) center', backgroundSize: '1.2rem 1.2rem' }}
                            >
                                <option value="Inter">Inter (Modern)</option>
                                <option value="Roboto">Roboto (Classic)</option>
                                <option value="Outfit">Outfit (Geometric)</option>
                                <option value="system-ui">System Default</option>
                            </select>
                        </div>

                        {/* Widget Placement */}
                        <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Widget Placement</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setWidgetPosition('bottom-left')}
                                    className={`flex-1 h-24 rounded-xl border flex flex-col items-center justify-center gap-3 transition-colors ${widgetPosition === 'bottom-left' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}
                                >
                                    <div className="w-12 h-8 bg-white border border-slate-200 rounded relative">
                                        <div className={`absolute bottom-1 left-1 w-2.5 h-2.5 rounded-sm ${widgetPosition === 'bottom-left' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">Bottom Left</span>
                                </button>
                                <button
                                    onClick={() => setWidgetPosition('bottom-right')}
                                    className={`flex-1 h-24 rounded-xl border flex flex-col items-center justify-center gap-3 transition-colors ${widgetPosition === 'bottom-right' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}
                                >
                                    <div className="w-12 h-8 bg-white border border-slate-200 rounded relative">
                                        <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-sm ${widgetPosition === 'bottom-right' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">Bottom Right</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Welcome & Behavior Section */}
                    <div className="space-y-6 pt-2">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Welcome & Behavior</h2>

                        {/* Auto Show Delay */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Auto-Show Widget (Seconds)</label>
                            <p className="text-[10px] text-slate-400 mt-0.5">Automatically open the chat window after a delay (0 to disable).</p>
                            <input
                                type="number"
                                min="0"
                                max="60"
                                value={autoShowDelay}
                                onChange={(e) => setAutoShowDelay(Number(e.target.value))}
                                className="w-full px-4 py-2.5 h-12 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                        </div>



                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Human Agent Escalation</label>
                                <p className="text-[10px] text-slate-500 mt-1">Allow users to request a human agent.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={enableHumanAgent}
                                    onChange={(e) => setEnableHumanAgent(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-slate-200 peer-checked:border-indigo-600 shadow-inner"></div>
                            </label>
                        </div>
                    </div>

                    {/* Lead Capture Section */}
                    <div className="space-y-6 pt-2">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center justify-between">
                            <span>Lead Capture</span>
                            <span className="text-[10px] font-bold tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 uppercase">New</span>
                        </h2>

                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enable Lead Form</label>
                                <p className="text-[10px] text-slate-500 mt-1">Collect visitor details before they can chat.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={leadCaptureEnabled}
                                    onChange={(e) => setLeadCaptureEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-slate-200 peer-checked:border-indigo-600 shadow-inner"></div>
                            </label>
                        </div>

                        {leadCaptureEnabled && (
                            <div className="space-y-4 p-4 border border-indigo-100 bg-indigo-50/10 rounded-lg">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Form Title</label>
                                    <input
                                        type="text"
                                        value={leadCaptureTitle}
                                        onChange={(e) => setLeadCaptureTitle(e.target.value)}
                                        placeholder="E.g. Let us know how to contact you"
                                        className="w-full px-4 py-2 h-10 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Information to Collect</label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={leadCaptureName} onChange={(e) => setLeadCaptureName(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm text-slate-700">Name</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={leadCaptureEmail} onChange={(e) => setLeadCaptureEmail(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm text-slate-700">Email Address</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={leadCapturePhone} onChange={(e) => setLeadCapturePhone(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm text-slate-700">Phone Number</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={leadCaptureCompany} onChange={(e) => setLeadCaptureCompany(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm text-slate-700">Company</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Custom Fields Builder */}
                                <div className="space-y-3 pt-6 border-t border-indigo-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Fields</h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Add any extra questions you want to ask.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLeadCaptureCustomFields([...leadCaptureCustomFields, { id: 'field_' + Date.now(), label: '', required: false }])}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-semibold rounded-md transition-colors"
                                        >
                                            <Plus size={14} /> Add Field
                                        </button>
                                    </div>

                                    {leadCaptureCustomFields.length > 0 ? (
                                        <div className="space-y-3">
                                            {leadCaptureCustomFields.map((field, index) => (
                                                <div key={field.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Question / Label (e.g. Budget?)"
                                                            value={field.label}
                                                            onChange={(e) => {
                                                                const newFields = [...leadCaptureCustomFields];
                                                                newFields[index].label = e.target.value;
                                                                setLeadCaptureCustomFields(newFields);
                                                            }}
                                                            className="w-full text-sm outline-none bg-transparent placeholder-slate-400 text-slate-900"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.required}
                                                                onChange={(e) => {
                                                                    const newFields = [...leadCaptureCustomFields];
                                                                    newFields[index].required = e.target.checked;
                                                                    setLeadCaptureCustomFields(newFields);
                                                                }}
                                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                                            />
                                                            <span className="text-[11px] font-medium text-slate-500">Required</span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setLeadCaptureCustomFields(leadCaptureCustomFields.filter(f => f.id !== field.id))}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"
                                                            title="Remove Field"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-white/50">
                                            <p className="text-xs text-slate-500">No custom fields added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Advanced Configurations */}
                    <div className="space-y-6 pt-2">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center justify-between">
                            <span>Advanced Configuration</span>
                        </h2>

                        {/* Theme Mode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Theme Mode</label>
                            <div className="flex bg-slate-50 p-1 border border-slate-200 rounded-lg">
                                {['light', 'dark', 'auto'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setThemeMode(mode as 'light' | 'dark' | 'auto')}
                                        className={`flex-1 py-2 text-xs font-semibold capitalize rounded-md transition-all ${themeMode === mode ? 'bg-white shadow-sm text-indigo-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Padding Offsets */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Widget Edge Padding (px)</label>
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500"><span className="font-semibold">X-Axis</span><span>{paddingOffset.x}px</span></div>
                                    <input type="range" min="0" max="64" value={paddingOffset.x} onChange={(e) => setPaddingOffset({ ...paddingOffset, x: Number(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500"><span className="font-semibold">Y-Axis</span><span>{paddingOffset.y}px</span></div>
                                    <input type="range" min="0" max="64" value={paddingOffset.y} onChange={(e) => setPaddingOffset({ ...paddingOffset, y: Number(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                </div>
                            </div>
                        </div>

                        {/* Allowed Domains */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Allowed Domains (Security)</label>
                            <p className="text-[10px] text-slate-400 mt-0.5">Whitelist domains where the widget can load (e.g., yourwebsite.com). Press Enter to add.</p>
                            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {allowedDomains.map(domain => (
                                        <span key={domain} className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                            {domain}
                                            <button onClick={() => handleRemoveDomain(domain)} className="text-slate-400 hover:text-red-500"><svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    onKeyDown={handleAddDomain}
                                    placeholder="Add domain and press Enter"
                                    className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none focus:ring-0 p-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Features */}
                    <div className="space-y-6 pt-2">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center justify-between">
                            <span>Enterprise Features</span>
                            <span className="text-[10px] font-bold tracking-wide text-orange-400 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">PREMIUM</span>
                        </h2>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Suggested Messages</label>
                            <p className="text-[10px] text-slate-400 mt-0.5">Quick replies for users to tap. Enter one per line.</p>
                            <textarea
                                rows={3}
                                value={suggestedMessages}
                                onChange={(e) => setSuggestedMessages(e.target.value)}
                                placeholder="What are your pricing plans?&#10;Book a demo"
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-slate-50/50"
                            ></textarea>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Launcher Tooltip</label>
                            <input
                                type="text"
                                value={launcherText}
                                onChange={(e) => setLauncherText(e.target.value)}
                                placeholder="Hey, need help? 💬"
                                className="w-full px-4 py-2.5 h-12 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remove Branding</label>
                                <p className="text-[10px] text-slate-500 mt-1">Hide &quot;Powered by ChatPulse AI&quot; watermark.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={removeBranding}
                                    onChange={(e) => setRemoveBranding(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-slate-200 peer-checked:border-indigo-600 shadow-inner"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">Voice Input (Beta)</label>
                                <p className="text-[10px] text-slate-500 mt-1">Allow users to speak their questions using a microphone.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={enableVoiceInput}
                                    onChange={(e) => setEnableVoiceInput(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 border border-slate-200 peer-checked:border-violet-600 shadow-inner"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Live Preview Panel - Sticky */}
                <div className="bg-[#f8fafc] sticky top-8 self-start flex flex-col items-center justify-start py-10 px-8 overflow-y-auto" style={{ height: 'calc(100vh - 128px)', fontFamily: fontFamily !== 'Inter' ? fontFamily : undefined, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23cbd5e1'/%3E%3C/svg%3E")` }}>

                    {/* Dotted border wrapper */}
                    <div className="border border-dashed border-slate-300 rounded-[40px] p-8 lg:p-14 relative w-full max-w-[500px] flex justify-center bg-white/40 shadow-sm backdrop-blur-[2px] mt-4">

                        {/* Top Left Live Preview Tag & Theme Indicator */}
                        <div className="absolute top-0 left-6 -translate-y-1/2 flex gap-2">
                            <div className="bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                                <span className="text-[11px] font-bold text-slate-500">Live Preview</span>
                            </div>
                            {themeMode !== 'light' && (
                                <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full shadow-sm">
                                    <span className="text-[11px] font-bold text-slate-300 capitalize">{themeMode} Mode Active</span>
                                </div>
                            )}
                        </div>

                        {/* Chat Window Mockup */}
                        <div className={`w-full max-w-[360px] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border ${themeMode === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-[#f8fafc]'} flex-shrink-0 transition-colors duration-300`} style={{ height: '480px' }}>

                            {/* Mock Header */}
                            <div className="p-4 flex justify-between items-center text-white" style={{ background: themeColor }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-white shadow-sm overflow-hidden bg-white/20 border border-white/30 backdrop-blur-sm">
                                        {botAvatarType === 'image' && botAvatar.startsWith('http') ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={botAvatar} alt="bot avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            botAvatarType === 'emoji' ? botAvatar : '🤖'
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-bold text-sm tracking-tight leading-tight">{botName}</div>
                                        <div className="text-[11px] text-white/80 font-medium">Online now</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 opacity-80">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 cursor-pointer hover:opacity-100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 cursor-pointer hover:opacity-100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                            </div>

                            {/* Mock Messages */}
                            <div className={`flex-1 p-5 flex flex-col overflow-y-auto ${themeMode === 'dark' ? 'bg-slate-900' : 'bg-[#fafafa]'}`}>

                                <div className="text-center mb-6 mt-2">
                                    <span className={`text-[10px] font-bold ${themeMode === 'dark' ? 'text-slate-600' : 'text-slate-400'} tracking-widest uppercase`}>TODAY</span>
                                </div>

                                {/* Mock Messages Wrapper */}
                                <div className="flex items-end gap-3 max-w-[85%] mb-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden shadow-sm border ${themeMode === 'dark' ? 'bg-indigo-900/50 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                        {botAvatarType === 'image' && botAvatar.startsWith('http') ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={botAvatar} alt="bot avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            'SB'
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div className={`text-[13px] p-4 rounded-2xl rounded-bl-sm leading-relaxed shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border ${themeMode === 'dark' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-100'}`}>
                                            {themeMode === 'dark' ? "Looking good in dark mode! 🌙" : "Hello there! 👋 How can we help you today?"}
                                        </div>
                                        <span className={`text-[9px] mt-1 ml-1 font-medium ${themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>09:41 AM</span>
                                    </div>
                                </div>

                                {/* User Message */}
                                <div className="flex justify-end mb-4 text-right">
                                    <div className="flex flex-col items-end max-w-[85%]">
                                        <div className="p-4 rounded-2xl rounded-br-sm text-[13px] shadow-sm font-medium leading-relaxed" style={{ background: themeColor, color: fontColor }}>
                                            {themeMode === 'dark' ? "I love this advanced configuration." : "I need help customizing my widget theme."}
                                        </div>
                                        <span className={`text-[9px] mt-1 mr-1 font-medium ${themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>09:42 AM</span>
                                    </div>
                                </div>

                                {/* Lead Capture Overlay Mockup */}
                                {leadCaptureEnabled && (
                                    <div className={`absolute inset-0 z-10 flex flex-col p-6 ${themeMode === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-sm`} style={{ top: '72px', bottom: '68px' }}>
                                        <div className={`text-[13px] font-semibold mb-4 text-center ${themeMode === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {leadCaptureTitle || 'Let us know how to contact you'}
                                        </div>
                                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
                                            {leadCaptureName && (
                                                <input disabled type="text" placeholder="Your Name *" className={`w-full text-[13px] px-3 py-2.5 rounded-lg border focus:outline-none ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                                            )}
                                            {leadCaptureEmail && (
                                                <input disabled type="email" placeholder="Email Address *" className={`w-full text-[13px] px-3 py-2.5 rounded-lg border focus:outline-none ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                                            )}
                                            {leadCapturePhone && (
                                                <input disabled type="tel" placeholder="Phone Number *" className={`w-full text-[13px] px-3 py-2.5 rounded-lg border focus:outline-none ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                                            )}
                                            {leadCaptureCompany && (
                                                <input disabled type="text" placeholder="Company Name" className={`w-full text-[13px] px-3 py-2.5 rounded-lg border focus:outline-none ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                                            )}
                                        </div>
                                        <button className="w-full py-3 mt-4 rounded-xl text-[13px] font-bold text-white shadow-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all mt-auto" style={{ background: themeColor, color: fontColor }}>
                                            <span>Start Chat</span>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                        </button>
                                    </div>
                                )}

                                {/* Bot Typing */}
                                <div className="flex items-end gap-3 max-w-[85%] mb-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden shadow-sm border ${themeMode === 'dark' ? 'bg-indigo-900/50 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                        {botAvatarType === 'image' && botAvatar.startsWith('http') ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={botAvatar} alt="bot avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            'SB'
                                        )}
                                    </div>
                                    <div className={`text-slate-400 p-3 px-4 rounded-2xl rounded-bl-sm text-lg leading-relaxed shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex gap-1 items-center h-[42px] border ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>

                                {/* Human Agent Link */}
                                {enableHumanAgent && (
                                    <div className="flex justify-center mt-6 mb-2">
                                        <button className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                                            Speak to Human Agent <span className="text-sm">→</span>
                                        </button>
                                    </div>
                                )}

                                {/* Suggested Messages */}
                                {suggestedMessages && (
                                    <div className="flex flex-wrap gap-2 mt-4 justify-end">
                                        {suggestedMessages.split('\n').filter(msg => msg.trim() !== '').map((msg, idx) => (
                                            <div key={idx} className={`text-[11px] font-medium border px-3 py-1.5 rounded-full shadow-sm ${themeMode === 'dark' ? 'bg-slate-800 text-indigo-400 border-indigo-900/50' : 'bg-white text-indigo-600 border-indigo-200'}`}>
                                                {msg}
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>

                            {/* Mock Input */}
                            <div className={`p-4 border-t flex flex-col items-center ${themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <div className={`w-full border rounded-full py-2.5 px-5 flex justify-between items-center ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <span className={`text-[13px] font-medium ${themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Type a message...</span>
                                    <div className="flex items-center gap-3">
                                        {enableVoiceInput && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'} hover:text-indigo-500 cursor-pointer transition-colors`}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                        )}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'} rotate-45`}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-indigo-600"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                    </div>
                                </div>
                                {!removeBranding && (
                                    <span className={`text-[9px] font-medium mt-2 flex items-center gap-1 ${themeMode === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                        Powered by ChatPulse AI
                                    </span>
                                )}
                            </div>

                        </div>

                        {/* Bottom Right Placement Indicator */}
                        {widgetPosition === 'bottom-right' && (
                            <div className="absolute -bottom-8 right-0 flex flex-col items-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-1"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                                <div className="bg-white border border-slate-200 px-3 py-1 rounded shadow-sm text-[10px] font-medium text-slate-500">
                                    Bottom Right
                                </div>
                            </div>
                        )}
                        {widgetPosition === 'bottom-left' && (
                            <div className="absolute -bottom-8 left-0 flex flex-col items-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-1"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                                <div className="bg-white border border-slate-200 px-3 py-1 rounded shadow-sm text-[10px] font-medium text-slate-500">
                                    Bottom Left
                                </div>
                            </div>
                        )}

                        {/* Launcher Tooltip Mockup */}
                        {launcherText && (
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white px-4 py-2.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-800 whitespace-nowrap">{launcherText}</span>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md overflow-hidden text-xs" style={{ background: themeColor }}>
                                    {botAvatarType === 'image' && botAvatar.startsWith('http') ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={botAvatar} alt="bot avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        botAvatarType === 'emoji' ? botAvatar : '🤖'
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div >
    );
}
