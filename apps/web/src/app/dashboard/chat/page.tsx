"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import {
    Search, Send, Paperclip, Image as ImageIcon, Smile, MoreVertical,
    X, Check, Clock, Tag, User,
    MessageSquare, ChevronLeft, Calendar,
    Trash2, Ban, Lock, CornerUpRight, EyeOff, Eraser, Zap, StickyNote
} from 'lucide-react';

interface CannedResponse {
    id: string;
    shortcut: string;
    title: string;
    content: string;
}

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
    endUser?: { name?: string; externalId?: string; email?: string; isBlocked?: boolean; profilePic?: string };
    messages: ChatMessage[];
}

export default function ChatDashboard() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [replyText, setReplyText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'waiting' | 'live' | 'blocked'>('all');
    const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
    const [cannedSearch, setCannedSearch] = useState("");
    const [showCannedPicker, setShowCannedPicker] = useState(false);
    const [agentNotes, setAgentNotes] = useState<{ id: string; agentName?: string; content: string; createdAt: string }[]>([]);
    const [noteText, setNoteText] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);
    const prevUnreadRef = useRef<number>(0);
    const originalTitleRef = useRef<string>('Inbox | Dashboard');
    const isInitializedRef = useRef<boolean>(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // Unlock AudioContext on first user click (browser requires gesture)
    useEffect(() => {
        const unlock = () => {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
        };
        window.addEventListener('click', unlock, { once: true });
        return () => window.removeEventListener('click', unlock);
    }, []);

    // Play a clean notification sound using Web Audio API
    const playNotificationSound = () => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx || ctx.state === 'suspended') return;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.35);
        } catch {
            // Browser blocked audio — silently ignore
        }
    };

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

    // Sound alert + tab title badge when new unread messages arrive
    useEffect(() => {
        if (!sessions.length) return;
        const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);

        // First load: silently sync the baseline without triggering a sound
        if (!isInitializedRef.current) {
            prevUnreadRef.current = totalUnread;
            isInitializedRef.current = true;
            return;
        }

        if (totalUnread > prevUnreadRef.current) {
            // Genuinely new message — play sound and update tab title
            playNotificationSound();
            document.title = `(${totalUnread}) New Message${totalUnread > 1 ? 's' : ''} | Inbox`;
        } else if (totalUnread === 0) {
            document.title = originalTitleRef.current;
        }
        prevUnreadRef.current = totalUnread;
    }, [sessions]);

    // Reset tab title when agent focuses the tab
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
                if (totalUnread === 0) document.title = originalTitleRef.current;
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            document.title = originalTitleRef.current;
        };
    }, [sessions]);

    const { user, isLoading } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Fetch Sessions
    useEffect(() => {
        if (isLoading || !user?.tenantId) return;
        axios.get(`${API_URL}/canned-responses/${user.tenantId}`)
            .then(res => setCannedResponses(res.data.data || []))
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.tenantId, isLoading]);

    // Fetch Sessions & Initialize WebSocket
    useEffect(() => {
        if (isLoading || !user?.tenantId) return;

        // 1. WebSocket Setup
        if (!socketRef.current) {
            socketRef.current = io(API_URL);

            socketRef.current.on('connect', () => {
                console.log('[Socket] Connected to server, joining room for tenant:', user.tenantId);
                socketRef.current?.emit('join_tenant', user.tenantId);
            });

            socketRef.current.on('new_message', (payload: { sessionId: string, message: ChatMessage }) => {
                // If the message belongs to the currently selected session, immediately show it
                setSelectedSessionId(currentId => {
                    if (currentId === payload.sessionId) {
                        setMessages(prev => {
                            // Deduplicate by message ID to prevent React duplicate key errors
                            if (prev.some(m => m.id === payload.message.id)) {
                                return prev;
                            }
                            return [...prev, payload.message];
                        });
                        // Mark as read immediately via API since we are actively looking at it
                        axios.post(`${API_URL}/chats/read`, { sessionId: currentId }).catch(() => { });
                    }
                    return currentId;
                });
            });

            socketRef.current.on('session_update', (payload: { session: ChatSession }) => {
                // Instantly update the session in the sidebar, move it to the top
                setSessions(prev => {
                    const filtered = prev.filter(s => s.id !== payload.session.id);
                    // Avoid putting restricted/blocked back if we're filtering them in the UI logic later
                    return [payload.session, ...filtered];
                });
            });
        }

        // 2. Initial Fetch
        const fetchSessions = async () => {
            try {
                const res = await axios.get(`${API_URL}/chats/sessions/${user.tenantId}`);
                setSessions(res.data.data);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            }
        };
        fetchSessions();

        // 3. Graceful Fallback Polling (Reduced frequency from 5s to 30s)
        const interval = setInterval(fetchSessions, 30000);

        return () => {
            clearInterval(interval);
            // We intentionally keep the socket alive across re-renders to avoid flicker,
            // but in a strict unmount, we could disconnect. For now, let it persist.
        };
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
        // Fallback polling reduced from 3s to 30s
        const interval = setInterval(fetchMessagesAndMarkRead, 30000);
        return () => clearInterval(interval);
    }, [selectedSessionId, API_URL]);

    // Fetch agent notes when session changes
    useEffect(() => {
        if (!selectedSessionId) { setAgentNotes([]); return; }
        axios.get(`${API_URL}/notes/${selectedSessionId}`)
            .then(res => setAgentNotes(res.data.data || []))
            .catch(() => setAgentNotes([]));
    }, [selectedSessionId, API_URL]);

    const handleAddNote = async () => {
        if (!noteText.trim() || !selectedSessionId) return;
        setNoteSaving(true);
        try {
            const res = await axios.post(`${API_URL}/notes`, {
                sessionId: selectedSessionId,
                agentName: user?.name || 'Agent',
                content: noteText.trim(),
            });
            setAgentNotes(prev => [res.data.data, ...prev]);
            setNoteText("");
        } catch { /* silent */ } finally { setNoteSaving(false); }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await axios.delete(`${API_URL}/notes/${noteId}`);
            setAgentNotes(prev => prev.filter(n => n.id !== noteId));
        } catch { /* silent */ }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedSessionId) return;

        try {
            const textToSend = replyText;
            setReplyText(""); // Clear input instantly for snappy feel

            // We no longer need optimistic UI updates like tempMsg 
            // because the Socket.io connection will echo our sent message back to us instantly.
            await axios.post(`${API_URL}/chats/reply`, {
                sessionId: selectedSessionId,
                text: textToSend
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
    const filteredSessions = sessions.filter(s => {
        const matchSearch = (s.endUser?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.messages[0]?.content || "").toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (activeFilter === 'waiting') return s.status === 'agent_requested';
        if (activeFilter === 'live') return s.status === 'agent_connected';
        if (activeFilter === 'blocked') return s.endUser?.isBlocked === true;
        return true; // 'all'
    });

    return (
        <div className="flex h-[calc(100vh-2.5rem)] md:h-[calc(100vh-4.5rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans text-gray-900">

            {/* LEFT SIDEBAR: Chat List */}
            <div className={`w-full md:w-64 lg:w-72 border-r border-gray-100 flex flex-col bg-white z-20 ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        Inbox
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100">
                            {filteredSessions.length}
                        </span>
                    </h1>
                </div>

                {/* Search */}
                <div className="p-3 bg-gray-50/50">
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

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 px-3 pb-2 border-b border-gray-100 overflow-x-auto">
                    {([
                        { key: 'all', label: 'All', count: sessions.length },
                        { key: 'waiting', label: '⏳ Waiting', count: sessions.filter(s => s.status === 'agent_requested').length },
                        { key: 'live', label: '🟢 Live', count: sessions.filter(s => s.status === 'agent_connected').length },
                        { key: 'blocked', label: '🚫 Blocked', count: sessions.filter(s => s.endUser?.isBlocked).length },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${activeFilter === tab.key
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}{tab.count > 0 && <span className="ml-1 opacity-75">({tab.count})</span>}
                        </button>
                    ))}
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
                                            {session.endUser?.profilePic ? (
                                                <img src={session.endUser.profilePic} alt={session.endUser.name || 'User'} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                                    {session.endUser?.name?.charAt(0) || 'V'}
                                                </div>
                                            )}
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
                                    {selectedSession?.endUser?.profilePic ? (
                                        <img src={selectedSession.endUser.profilePic} alt={selectedSession.endUser.name || 'User'} className="w-9 h-9 rounded-full object-cover shadow-sm" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {(selectedSession?.endUser?.name || 'V').charAt(0)}
                                        </div>
                                    )}
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
                            {/* Canned Response Picker */}
                            {showCannedPicker && (() => {
                                const filtered = cannedResponses.filter(r =>
                                    r.shortcut.includes(cannedSearch) ||
                                    r.title.toLowerCase().includes(cannedSearch)
                                );
                                if (!filtered.length) return null;
                                return (
                                    <div className="mb-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                                            <Zap size={11} className="text-indigo-500" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quick Replies — type shortcut or press Esc to close</span>
                                        </div>
                                        {filtered.map(r => (
                                            <button
                                                key={r.id}
                                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition text-xs flex items-start gap-3 border-b border-gray-50 last:border-0"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setReplyText(r.content);
                                                    setShowCannedPicker(false);
                                                }}
                                            >
                                                <span className="font-mono text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0">/{r.shortcut}</span>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate text-[11px]">{r.title}</p>
                                                    <p className="text-gray-500 truncate text-[10px]">{r.content}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                            <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner">
                                <textarea
                                    className="w-full bg-transparent border-0 text-xs text-gray-700 placeholder-gray-400 px-4 py-3 min-h-[50px] max-h-32 resize-none outline-none focus:ring-0"
                                    placeholder="Type your reply here..."
                                    value={replyText}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setReplyText(val);
                                        if (val.startsWith('/')) {
                                            setCannedSearch(val.slice(1).toLowerCase());
                                            setShowCannedPicker(true);
                                        } else {
                                            setShowCannedPicker(false);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setShowCannedPicker(false);
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
            {selectedSessionId && (() => {
                const user = selectedSession?.endUser;
                const externalId = user?.externalId || '';
                const platform = externalId.startsWith('messenger-') ? 'Messenger'
                    : externalId.startsWith('wa_') ? 'WhatsApp'
                        : 'Widget';
                const platformColors: Record<string, string> = {
                    'Messenger': 'bg-blue-50 text-blue-700 border-blue-100',
                    'WhatsApp': 'bg-green-50 text-green-700 border-green-100',
                    'Widget': 'bg-indigo-50 text-indigo-700 border-indigo-100',
                };
                const moodColors: Record<string, string> = {
                    frustrated: 'bg-orange-50 text-orange-700',
                    furious: 'bg-red-50 text-red-700',
                    neutral: 'bg-gray-50 text-gray-600',
                };

                return (
                    <div className="w-64 bg-white border-l border-gray-100 hidden lg:flex flex-col overflow-y-auto">
                        {/* Avatar & Name */}
                        <div className="p-5 border-b border-gray-100 flex flex-col items-center text-center bg-gradient-to-b from-gray-50/50 to-white">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt={user.name || 'User'} className="w-20 h-20 rounded-full object-cover mb-3 shadow-sm ring-4 ring-white" />
                            ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-sm ring-4 ring-white">
                                    {(user?.name || 'V').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <h3 className="font-bold text-sm text-gray-900 leading-tight">{user?.name || 'Visitor'}</h3>
                            {user?.email && (
                                <p className="text-[10px] text-gray-500 font-mono mt-1 px-2 py-0.5 bg-gray-100 rounded">{user.email}</p>
                            )}
                            <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${platformColors[platform]}`}>{platform}</span>
                                {user?.isBlocked && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-100">🚫 Blocked</span>
                                )}
                                {selectedSession?.isRestricted && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100">🔇 AI Muted</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Session Status */}
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Session Status</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${selectedSession?.status === 'agent_connected' ? 'bg-green-500 animate-pulse'
                                        : selectedSession?.status === 'agent_requested' ? 'bg-amber-500 animate-pulse'
                                            : 'bg-gray-300'
                                        }`}></div>
                                    <span className="text-xs font-semibold text-gray-700 capitalize">
                                        {selectedSession?.status === 'agent_connected' ? 'Live Agent'
                                            : selectedSession?.status === 'agent_requested' ? 'Waiting for Agent'
                                                : 'AI Chat'}
                                    </span>
                                </div>
                                {selectedSession?.currentMood && (
                                    <div className={`mt-2 text-[10px] px-2 py-1 rounded-lg font-medium ${moodColors[selectedSession.currentMood] || 'bg-gray-50 text-gray-600'}`}>
                                        {selectedSession.currentMood === 'frustrated' ? '😤 Frustrated'
                                            : selectedSession.currentMood === 'furious' ? '😡 Furious'
                                                : '😐 Neutral'}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <User size={11} /> User Details
                                </h4>
                                <div className="space-y-2.5">
                                    <div className="flex items-start gap-2 text-xs">
                                        <Calendar size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-400">First Seen</p>
                                            <p className="font-medium text-gray-800 text-[11px]">
                                                {selectedSession?.updatedAt
                                                    ? format(new Date(selectedSession.updatedAt), 'dd MMM yyyy, h:mm a')
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs">
                                        <Tag size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400">User ID</p>
                                            <p className="font-mono text-[10px] text-gray-600 truncate">{externalId || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs">
                                        <MessageSquare size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-400">Messages</p>
                                            <p className="font-medium text-gray-800 text-[11px]">{messages.length} in this session</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h4>
                                <div className="space-y-1.5">
                                    <button
                                        onClick={() => handleMenuAction('block')}
                                        className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition border ${user?.isBlocked
                                            ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                                            }`}
                                    >
                                        {user?.isBlocked ? '✅ Unblock User' : '🚫 Block User'}
                                    </button>
                                    <button
                                        onClick={() => handleMenuAction('restricted')}
                                        className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition border ${selectedSession?.isRestricted
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                                            : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                                            }`}
                                    >
                                        {selectedSession?.isRestricted ? '🔊 Enable AI' : '🔇 Mute AI'}
                                    </button>
                                </div>
                            </div>

                            {/* Private Notes */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <StickyNote size={11} className="text-amber-500" /> Private Notes
                                    <span className="text-[9px] text-gray-300 font-normal ml-auto">Agent only</span>
                                </h4>

                                {/* Existing notes */}
                                {agentNotes.length > 0 && (
                                    <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto pr-0.5">
                                        {agentNotes.map(note => (
                                            <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 group relative">
                                                <p className="text-[10px] text-gray-700 leading-relaxed">{note.content}</p>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className="text-[9px] text-gray-400">
                                                        {note.agentName} · {format(new Date(note.createdAt), 'h:mm a')}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="text-gray-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add note */}
                                <div className="space-y-1.5">
                                    <textarea
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                        placeholder="Add a private note..."
                                        rows={2}
                                        className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 placeholder-gray-400 resize-none outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition"
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={noteSaving || !noteText.trim()}
                                        className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${noteText.trim()
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                            : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                                            }`}
                                    >
                                        {noteSaving ? 'Saving...' : '+ Save Note'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}
