"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import {
    Search, Send, Paperclip, Image as ImageIcon, Smile, MoreVertical,
    X, Check, Clock, MapPin, Tag, User,
    MessageSquare, Filter, ChevronLeft, Calendar,
    Trash2, Ban, Lock, CornerUpRight, EyeOff, Eraser
} from 'lucide-react';

interface ChatMessage {
    id: number | string;
    role: string;
    content: string;
    createdAt: string;
    sentimentLabel?: string;
}

interface ChatSession {
    id: string;
    status?: string;
    currentMood?: string;
    updatedAt: string;
    isRestricted?: boolean;
    unreadCount?: number;
    endUser?: { name?: string; externalId?: string; email?: string; isBlocked?: boolean };
    messages: ChatMessage[];
}

export default function ChatDashboard() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [replyText, setReplyText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom logic
    useEffect(() => {
        if (shouldAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, shouldAutoScroll]);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        }
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const { user, isLoading } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Fetch Sessions
    useEffect(() => {
        if (isLoading || !user?.tenantId) return;

        const fetchSessions = async () => {
            try {
                const res = await axios.get(`${API_URL}/chats/sessions/${user.tenantId}`);
                setSessions(res.data.data);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            }
        };
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000);
        return () => clearInterval(interval);
    }, [user?.tenantId, isLoading, API_URL]);

    // Fetch Messages when session selected & Mark as Read
    useEffect(() => {
        if (!selectedSessionId) return;

        const fetchMessagesAndMarkRead = async () => {
            try {
                // 1. Mark backend as read
                await axios.post(`${API_URL}/chats/read`, { sessionId: selectedSessionId });

                // 2. Update local state to remove unread badge immediately
                setSessions(prev => prev.map(s =>
                    s.id === selectedSessionId ? { ...s, unreadCount: 0 } : s
                ));

                // 3. Fetch messages
                const res = await axios.get(`${API_URL}/chats/messages/${selectedSessionId}`);
                setMessages(res.data.data);
            } catch (err) {
                console.error("Failed to fetch messages or mark read", err);
            }
        };
        fetchMessagesAndMarkRead();
        const interval = setInterval(fetchMessagesAndMarkRead, 3000);
        return () => clearInterval(interval);
    }, [selectedSessionId, API_URL]);

    // (auto-scroll reset is handled in the session selection handler below)

    const handleReply = async () => {
        if (!replyText.trim() || !selectedSessionId) return;

        try {
            const tempMsg = {
                id: Date.now(),
                role: 'assistant',
                content: replyText,
                createdAt: new Date().toISOString()
            };
            setMessages([...messages, tempMsg]);
            setReplyText("");

            await axios.post(`${API_URL}/chats/reply`, {
                sessionId: selectedSessionId,
                text: tempMsg.content
            });
        } catch (err) {
            console.error("Failed to send reply", err);
            alert("Failed to send message: " + (err as Error).message);
        }
    };

    const handleAcceptAgent = async (sessionId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, status: 'agent_connected' as const } : s
        ));
        try {
            await axios.post(`${API_URL}/chats/accept-agent`, { sessionId, agentName: 'Support Agent' });
        } catch (err) {
            console.error("Failed to accept agent", err);
            alert("Failed to accept: " + (err as Error).message);
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? { ...s, status: 'agent_requested' as const } : s
            ));
        }
    };

    const handleRejectAgent = async (sessionId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, status: 'active' as const } : s
        ));
        try {
            await axios.post(`${API_URL}/chats/reject-agent`, { sessionId });
        } catch (err) {
            console.error("Failed to reject agent", err);
            alert("Failed to reject: " + (err as Error).message);
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? { ...s, status: 'agent_requested' as const } : s
            ));
        }
    };

    const handleEndChat = async (sessionId: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, status: 'active' as const } : s
        ));
        try {
            await axios.post(`${API_URL}/chats/end-agent-chat`, { sessionId });
        } catch (err) {
            console.error("Failed to end chat", err);
            alert("Failed to end chat: " + (err as Error).message);
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? { ...s, status: 'agent_connected' as const } : s
            ));
        }
    };

    const handleMenuAction = async (action: string) => {
        setShowMenu(false);
        if (!selectedSessionId) return;

        const currentSession = sessions.find(s => s.id === selectedSessionId);
        if (!currentSession) return;

        switch (action) {
            case 'transfer':
                alert('Transfer Chat feature coming soon!');
                break;
            case 'unread':
                alert('Marked as unread');
                break;
            case 'restricted':
                if (currentSession.isRestricted) {
                    try {
                        await axios.post(`${API_URL}/chats/unrestrict-session`, { sessionId: selectedSessionId });
                        setSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, isRestricted: false } : s));
                        alert('Restricted Mode disabled. AI will now auto-reply.');
                    } catch (err) {
                        console.error("Failed to unrestrict session", err);
                        alert("Failed to unrestrict session: " + (err as Error).message);
                    }
                } else {
                    try {
                        await axios.post(`${API_URL}/chats/restrict-session`, { sessionId: selectedSessionId });
                        setSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, isRestricted: true } : s));
                        alert('Restricted Mode enabled for this user. AI will no longer reply.');
                    } catch (err) {
                        console.error("Failed to restrict session", err);
                        alert("Failed to restrict session: " + (err as Error).message);
                    }
                }
                break;
            case 'block':
                const isBlocked = currentSession.endUser?.isBlocked;
                if (isBlocked) {
                    if (confirm('Are you sure you want to UNBLOCK this user?')) {
                        try {
                            await axios.post(`${API_URL}/chats/unblock-user`, { sessionId: selectedSessionId });
                            setSessions(prev => prev.map(s => {
                                if (s.id === selectedSessionId && s.endUser) {
                                    return { ...s, endUser: { ...s.endUser, isBlocked: false } };
                                }
                                return s;
                            }));
                            alert('User has been unblocked.');
                        } catch (err) {
                            console.error("Failed to unblock user", err);
                            alert("Failed to unblock user: " + (err as Error).message);
                        }
                    }
                } else {
                    if (confirm('Are you sure you want to BLOCK this user? They will not be able to send messages.')) {
                        try {
                            await axios.post(`${API_URL}/chats/block-user`, { sessionId: selectedSessionId });
                            setSessions(prev => prev.map(s => {
                                if (s.id === selectedSessionId && s.endUser) {
                                    return { ...s, endUser: { ...s.endUser, isBlocked: true } };
                                }
                                return s;
                            }));
                            alert('User has been blocked.');
                        } catch (err) {
                            console.error("Failed to block user", err);
                            alert("Failed to block user: " + (err as Error).message);
                        }
                    }
                }
                break;
            case 'clear':
                if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
                    try {
                        await axios.post(`${API_URL}/chats/clear-conversation`, { sessionId: selectedSessionId });
                        setMessages([]);
                        alert('Conversation cleared');
                    } catch (err) {
                        console.error("Failed to clear conversation", err);
                        alert("Failed to clear conversation: " + (err as Error).message);
                    }
                }
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this session? This cannot be undone.')) {
                    try {
                        await axios.post(`${API_URL}/chats/delete-session`, { sessionId: selectedSessionId });
                        setSessions(prev => prev.filter(s => s.id !== selectedSessionId));
                        setSelectedSessionId(null);
                        alert('Session deleted');
                    } catch (err) {
                        console.error("Failed to delete session", err);
                        alert("Failed to delete session: " + (err as Error).message);
                    }
                }
                break;
        }
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const filteredSessions = sessions.filter(s =>
        (s.endUser?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.messages[0]?.content || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-2.5rem)] md:h-[calc(100vh-4.5rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans text-gray-900">

            {/* LEFT SIDEBAR: Chat List */}
            <div className={`w-full md:w-64 lg:w-72 border-r border-gray-100 flex flex-col bg-white z-20 ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        Inbox
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100">
                            {sessions.length}
                        </span>
                    </h1>
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 transition">
                        <Filter size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative group">
                        <input
                            type="text"
                            className="w-full bg-white border border-gray-200 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm group-hover:border-gray-300"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 group-hover:text-gray-500 transition-colors" />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredSessions
                        .sort((a, b) => {
                            // Sort by Last Message Time (to avoid jumping when read status changes)
                            const timeA = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : new Date(a.updatedAt).getTime();
                            const timeB = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : new Date(b.updatedAt).getTime();

                            return timeB - timeA;
                        })
                        .map((session) => {
                            const lastMessage = session.messages?.[0];
                            const isUnread = (session.unreadCount || 0) > 0;
                            const isOnline = session.status === 'agent_requested' || session.status === 'agent_connected';

                            let StatusBadge = null;
                            if (session.status === 'agent_requested') {
                                StatusBadge = (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold flex items-center gap-1 border border-amber-100">
                                        <Clock size={10} className="animate-pulse" /> Waiting
                                    </span>
                                );
                            } else if (session.status === 'agent_connected') {
                                StatusBadge = (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md font-bold flex items-center gap-1 border border-green-100">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Live
                                    </span>
                                );
                            }

                            return (
                                <div
                                    key={session.id}
                                    onClick={() => { setSelectedSessionId(session.id); setShouldAutoScroll(true); }}
                                    className={`p-3 cursor-pointer rounded-xl transition-all duration-200 border border-transparent ${selectedSessionId === session.id
                                        ? 'bg-indigo-50/60 border-indigo-100 shadow-sm'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                                {session.endUser?.name?.charAt(0) || 'V'}
                                            </div>
                                            {isOnline && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between mb-0.5">
                                                <h3 className={`text-xs truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {session.endUser?.name || 'Visitor'}
                                                </h3>
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                    {format(new Date(session.updatedAt), 'HH:mm')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className={`text-[11px] flex-1 truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                                    {lastMessage?.content || 'No messages yet'}
                                                </p>
                                                {isUnread && (
                                                    <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 animate-pulse"></div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {StatusBadge}
                                                {session.currentMood && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1 ${session.currentMood === 'furious' || session.currentMood === 'frustrated'
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : 'bg-gray-50 text-gray-600 border border-gray-100'
                                                        }`}>
                                                        {session.currentMood === 'frustrated' && '😤 Frustrated'}
                                                        {session.currentMood === 'furious' && '😡 Furious'}
                                                        {session.currentMood === 'neutral' && '😐 Neutral'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {filteredSessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <MessageSquare className="text-gray-300" size={20} />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">No conversations found</p>
                            <p className="text-[10px] text-gray-400 mt-1">Try a different search term</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MIDDLE: Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-white z-0 relative ${!selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
                {selectedSessionId ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-white z-10 h-16 shadow-sm">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedSessionId(null)}
                                    className="md:hidden p-1.5 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="relative">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {(selectedSession?.endUser?.name || 'V').charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">
                                        {selectedSession?.endUser?.name || 'Visitor'}
                                        {selectedSession?.status === 'agent_connected' && (
                                            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-green-50 text-green-700 border border-green-100">
                                                Live Support
                                            </span>
                                        )}
                                    </h2>
                                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active now
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Action Buttons */}
                                {selectedSession?.status === 'agent_requested' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRejectAgent(selectedSessionId!)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-1.5">
                                            <X size={14} /> Ignore
                                        </button>
                                        <button onClick={() => handleAcceptAgent(selectedSessionId!)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5">
                                            <Check size={14} /> Accept Chat
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Audio/Video call icons removed */}
                                        {selectedSession?.status === 'agent_connected' && (
                                            <button onClick={() => handleEndChat(selectedSessionId!)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition border border-red-100 flex items-center gap-1.5">
                                                <X size={14} /> End Chat
                                            </button>
                                        )}
                                    </>
                                )}

                                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                                {/* Menu with click-outside-to-close */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className={`p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition ${showMenu ? 'bg-gray-100 text-gray-700' : ''}`}
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {showMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <div className="p-1.5 space-y-0.5">
                                                <button onClick={() => handleMenuAction('transfer')} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition">
                                                    <CornerUpRight size={14} className="text-gray-400" /> Transfer Chat
                                                </button>
                                                <button onClick={() => handleMenuAction('unread')} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition">
                                                    <EyeOff size={14} className="text-gray-400" /> Mark as Unread
                                                </button>

                                                <div className="h-px bg-gray-100 my-1"></div>

                                                <button onClick={() => handleMenuAction('clear')} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition">
                                                    <Eraser size={14} className="text-gray-400" /> Clear Conversation
                                                </button>

                                                <button
                                                    onClick={() => handleMenuAction('restricted')}
                                                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition ${selectedSession?.isRestricted ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                                                >
                                                    {selectedSession?.isRestricted ? (
                                                        <><Lock size={14} className="text-green-500" /> Unrestrict Chat</>
                                                    ) : (
                                                        <><Lock size={14} className="text-orange-500" /> Restricted Mode</>
                                                    )}
                                                </button>

                                                <div className="h-px bg-gray-100 my-1"></div>

                                                <button
                                                    onClick={() => handleMenuAction('block')}
                                                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition ${selectedSession?.endUser?.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                                                >
                                                    {selectedSession?.endUser?.isBlocked ? (
                                                        <><Check size={14} className="text-green-500" /> Unblock User</>
                                                    ) : (
                                                        <><Ban size={14} className="text-red-500" /> Block User</>
                                                    )}
                                                </button>
                                                <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition">
                                                    <Trash2 size={14} className="text-red-400" /> Delete Session
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6"
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                        >
                            <div className="flex justify-center">
                                <div className="bg-gray-200/60 text-gray-500 text-[10px] font-medium px-3 py-1 rounded-full border border-gray-200">
                                    Today, {format(new Date(), 'MMMM d')}
                                </div>
                            </div>

                            {messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                const showAvatar = !isUser && (index === 0 || messages[index - 1].role === 'user');

                                return (
                                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`flex gap-3 max-w-[80%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                                            {!isUser && (
                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${showAvatar ? 'bg-indigo-600 opacity-100' : 'opacity-0'}`}>
                                                    AI
                                                </div>
                                            )}

                                            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2.5 text-sm shadow-sm ${isUser
                                                    ? 'bg-white text-gray-800 rounded-2xl rounded-tr-sm border border-gray-100'
                                                    : 'bg-indigo-600 text-white rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                <span className={`text-[9px] mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'text-gray-400 mr-1' : 'text-gray-400 ml-1'}`}>
                                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner">
                                <textarea
                                    className="w-full bg-transparent border-0 text-xs text-gray-700 placeholder-gray-400 px-4 py-3 min-h-[50px] max-h-32 resize-none outline-none focus:ring-0"
                                    placeholder="Type your reply here..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleReply();
                                        }
                                    }}
                                />
                                <div className="flex items-center justify-between px-2 pb-2">
                                    <div className="flex gap-1 text-gray-400">
                                        <button className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Attach File">
                                            <Paperclip size={16} />
                                        </button>
                                        <button className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Insert Image">
                                            <ImageIcon size={16} />
                                        </button>
                                        <button className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Insert Emoji">
                                            <Smile size={16} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim()}
                                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${replyText.trim()
                                            ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transform hover:-translate-y-0.5'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Send <Send size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                            <MessageSquare className="text-indigo-200" size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Inbox</h3>
                        <p className="text-gray-500 max-w-xs text-center text-sm leading-relaxed">
                            Select a conversation from the left sidebar to start chatting with your visitors.
                        </p>
                    </div>
                )}
            </div>

            {/* RIGHT SIDEBAR: Customer Details */}
            {selectedSessionId && (
                <div className="w-64 bg-white border-l border-gray-100 hidden lg:flex flex-col overflow-y-auto">
                    <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center bg-gradient-to-b from-gray-50/50 to-white">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 mb-4 shadow-sm ring-4 ring-white">
                            {(selectedSession?.endUser?.name || 'V').charAt(0)}
                        </div>
                        <h3 className="font-bold text-base text-gray-900">{selectedSession?.endUser?.name || 'Visitor'}</h3>
                        <p className="text-[11px] text-gray-500 font-mono mt-1 px-2 py-0.5 bg-gray-100 rounded text-center">
                            {selectedSession?.endUser?.email || 'user@example.com'}
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status Card */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Current Status</h4>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-semibold text-gray-700">Online</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <Clock size={12} />
                                Local time: {format(new Date(), 'h:mm a')}
                            </div>
                        </div>

                        {/* Details */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={12} /> Customer Details
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 text-xs">
                                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Dhaka, Bangladesh</p>
                                        <p className="text-[10px] text-gray-500">IP: 192.168.1.1</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-xs">
                                    <Calendar size={14} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">First Seen</p>
                                        <p className="text-[10px] text-gray-500">2 days ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Tag size={12} /> Tags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] rounded-md font-bold border border-indigo-100">Lead</span>
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] rounded-md font-bold border border-purple-100">New User</span>
                                <button className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-md border border-gray-200 border-dashed hover:border-gray-300 hover:text-gray-600 transition">
                                    + Add
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 mt-auto">
                            <button className="w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-xs">
                                View Full CRM Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
