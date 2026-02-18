"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Book, BarChart2, Settings, Puzzle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    // Navigation Items
    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Conversations', href: '/dashboard/chat', icon: MessageSquare, badge: 12 },
        { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: Book },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
        { name: 'Integrations', href: '/dashboard/integration', icon: Puzzle },
    ];

    const bottomItems = [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 z-20 shadow-xl transition-all duration-300">

                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
                    <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <MessageSquare className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-slate-100">ChatPulse AI</span>
                    </Link>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} />
                                    <span>{item.name}</span>
                                </div>
                                {item.badge && (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-8">Configuration</p>
                    {bottomItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                                    }`}
                            >
                                <item.icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800">
                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{user?.email?.split('@')[0] || 'Alex Designer'}</p>
                            <p className="text-[9px] text-slate-500 font-medium truncate flex items-center gap-1 group-hover:text-slate-400">
                                Pro Plan
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-700"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
