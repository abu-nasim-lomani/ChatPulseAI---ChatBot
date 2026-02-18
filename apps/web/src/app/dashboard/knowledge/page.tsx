"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    BookOpen, Upload, Globe, Plus, Trash2, Eye, FileText,
    Search, X, CheckCircle, AlertCircle, Loader2, Database,
    FileJson, Sheet, File
} from 'lucide-react';

interface KnowledgeResource {
    source: string;
    sourceType: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}

const SOURCE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pdf: { label: 'PDF', color: 'bg-red-50 text-red-700 border-red-100', icon: <File size={10} /> },
    docx: { label: 'DOCX', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <FileText size={10} /> },
    excel: { label: 'XLSX', color: 'bg-green-50 text-green-700 border-green-100', icon: <Sheet size={10} /> },
    csv: { label: 'CSV', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Sheet size={10} /> },
    url: { label: 'URL', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Globe size={10} /> },
    json: { label: 'JSON', color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: <FileJson size={10} /> },
    text: { label: 'TEXT', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <FileText size={10} /> },
};

export default function KnowledgePage() {
    const { user, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'text' | 'file' | 'url'>('text');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // List & View State
    const [knowledgeList, setKnowledgeList] = useState<KnowledgeResource[]>([]);
    const [viewingDoc, setViewingDoc] = useState<{ source: string; content: string } | null>(null);

    // Form States
    const [content, setContent] = useState('');
    const [source, setSource] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const tenantId = user?.tenantId;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

    const fetchKnowledge = useCallback(async () => {
        if (!tenantId) return;
        try {
            const res = await axios.get(`${apiUrl}/knowledge/list`, { params: { tenantId } });
            setKnowledgeList(res.data);
        } catch (error) {
            console.error('Failed to fetch knowledge list:', error);
        }
    }, [apiUrl, tenantId]);

    useEffect(() => {
        if (!authLoading) fetchKnowledge();
    }, [fetchKnowledge, authLoading]);

    // Auto-dismiss message
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const handleAddKnowledge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;
        setIsLoading(true);
        setMessage(null);

        try {
            let response;
            if (activeTab === 'text') {
                response = await axios.post(`${apiUrl}/knowledge/add`, {
                    tenantId, content, source: source || 'Manual Entry', sourceType: 'text'
                });
            } else if (activeTab === 'file') {
                if (!file) throw new Error('No file selected');
                const formData = new FormData();
                formData.append('tenantId', tenantId);
                formData.append('file', file);
                response = await axios.post(`${apiUrl}/knowledge/upload`, formData);
            } else if (activeTab === 'url') {
                if (!url) throw new Error('No URL provided');
                response = await axios.post(`${apiUrl}/knowledge/crawl`, { tenantId, url });
            }

            if (response?.data?.success || response?.data?.chunks) {
                setMessage({ text: 'Knowledge added successfully!', type: 'success' });
                setContent(''); setSource(''); setFile(null); setUrl('');
                fetchKnowledge();
            } else {
                throw new Error('Failed to add knowledge');
            }
        } catch (error: unknown) {
            let errorMsg = 'Failed to add knowledge.';
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMsg = error.response.data.error;
            } else if (error instanceof Error) {
                errorMsg = error.message;
            }
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewContent = async (src: string) => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/knowledge/content`, { params: { tenantId, source: src } });
            setViewingDoc({ source: src, content: res.data.content });
        } catch {
            setMessage({ text: 'Failed to load document content.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteKnowledge = async (src: string) => {
        if (!tenantId) return;
        if (!confirm(`Delete "${src}"? This cannot be undone.`)) return;
        setIsLoading(true);
        try {
            await axios.delete(`${apiUrl}/knowledge/delete`, { params: { tenantId, source: src } });
            setMessage({ text: 'Knowledge deleted successfully!', type: 'success' });
            fetchKnowledge();
        } catch {
            setMessage({ text: 'Failed to delete knowledge.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    const isSubmitDisabled = isLoading
        || (activeTab === 'text' && (!content || !source))
        || (activeTab === 'file' && !file)
        || (activeTab === 'url' && !url);

    const filteredList = knowledgeList.filter(item =>
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'text' as const, label: 'Text', icon: <BookOpen size={14} /> },
        { id: 'file' as const, label: 'File Upload', icon: <Upload size={14} /> },
        { id: 'url' as const, label: 'Website URL', icon: <Globe size={14} /> },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-2.5rem)] md:h-[calc(100vh-4.5rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans text-gray-900">

            {/* Page Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Database size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight">Knowledge Base</h1>
                        <p className="text-[11px] text-gray-500">Train your AI with text, files, and websites</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-green-700">System Active</span>
                </div>
            </div>

            {/* Toast Notification */}
            {message && (
                <div className={`mx-6 mt-4 flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5 border shadow-sm transition-all ${message.type === 'success'
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

                {/* LEFT: Add Knowledge Form */}
                <div className="w-full lg:w-[55%] flex flex-col border-r border-gray-100 overflow-y-auto">

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === tab.id
                                        ? 'text-indigo-600 border-indigo-600 bg-white'
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white/60'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAddKnowledge} className="flex flex-col flex-1 p-6 space-y-5">

                        {/* TEXT TAB */}
                        {activeTab === 'text' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">
                                        Source Title <span className="text-gray-400 font-normal">(required)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition placeholder-gray-400"
                                        placeholder="e.g. Return Policy 2024"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-gray-700">Content</label>
                                        <span className="text-[10px] text-gray-400 font-medium">{content.length} chars</span>
                                    </div>
                                    <textarea
                                        className="flex-1 w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition placeholder-gray-400 resize-none leading-relaxed min-h-[220px]"
                                        placeholder="Paste the text you want your AI to learn from..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* FILE TAB */}
                        {activeTab === 'file' && (
                            <div className="flex-1 flex flex-col space-y-4">
                                <div
                                    className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 text-center transition-all cursor-pointer min-h-[260px] ${isDragging
                                            ? 'border-indigo-400 bg-indigo-50/60'
                                            : file
                                                ? 'border-green-300 bg-green-50/40'
                                                : 'border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'
                                        }`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.json,.xlsx,.xls,.csv"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <>
                                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                                <CheckCircle size={32} className="text-green-600" />
                                            </div>
                                            <p className="font-bold text-gray-900 text-sm">{file.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to process</p>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Remove file
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                                <Upload size={28} className="text-indigo-500" />
                                            </div>
                                            <p className="font-bold text-gray-800 text-sm">Drop your file here</p>
                                            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                                            <p className="text-[10px] text-gray-400 mt-3 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                                PDF · DOCX · XLSX · CSV · JSON
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* URL TAB */}
                        {activeTab === 'url' && (
                            <div className="flex-1 flex flex-col space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Website URL</label>
                                    <div className="relative">
                                        <Globe size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                        <input
                                            type="url"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition placeholder-gray-400"
                                            placeholder="https://example.com/about"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-500">We will scrape the main text content from this page.</p>
                                </div>

                                {/* Info card */}
                                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 mt-auto">
                                    <h4 className="text-xs font-bold text-indigo-800 mb-2">Supported Formats</h4>
                                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-indigo-700/80">
                                        <span>• <b>Text:</b> Direct copy-paste</span>
                                        <span>• <b>PDF:</b> Auto-extracts text</span>
                                        <span>• <b>DOCX:</b> Word documents</span>
                                        <span>• <b>Excel/CSV:</b> Spreadsheets</span>
                                        <span>• <b>JSON:</b> Structured data</span>
                                        <span>• <b>URL:</b> Website scraping</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2 flex-shrink-0">
                            <button
                                type="submit"
                                disabled={isSubmitDisabled}
                                className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isSubmitDisabled
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {isLoading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                ) : (
                                    <><Plus size={16} /> Add to Knowledge Base</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: Knowledge List */}
                <div className="hidden lg:flex flex-col flex-1 overflow-hidden">

                    {/* List Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                Stored Knowledge
                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100">
                                    {knowledgeList.length} items
                                </span>
                            </h2>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder-gray-400"
                                placeholder="Search knowledge..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Database size={28} className="text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">
                                    {searchTerm ? 'No results found' : 'No knowledge added yet'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {searchTerm ? 'Try a different search term' : 'Add text, files, or URLs to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 p-2 space-y-0.5">
                                {filteredList.map((item, index) => {
                                    const typeConfig = SOURCE_TYPE_CONFIG[item.sourceType] || SOURCE_TYPE_CONFIG.text;
                                    return (
                                        <div
                                            key={index}
                                            className="p-3.5 hover:bg-gray-50 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <FileText size={14} className="text-gray-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-xs font-semibold text-gray-900 truncate flex-1" title={item.source}>
                                                            {item.source}
                                                        </h4>
                                                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border flex items-center gap-1 ${typeConfig.color}`}>
                                                            {typeConfig.icon}
                                                            {typeConfig.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-400">
                                                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleViewContent(item.source)}
                                                                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition"
                                                            >
                                                                <Eye size={11} /> View
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteKnowledge(item.source)}
                                                                className="flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition"
                                                            >
                                                                <Trash2 size={11} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Content Modal */}
            {viewingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText size={16} className="text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 truncate">{viewingDoc.source}</h3>
                            </div>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-gray-50">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-full">
                                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 leading-relaxed">
                                    {viewingDoc.content}
                                </pre>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-white rounded-b-2xl flex-shrink-0">
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
