"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const login = useCallback((newToken: string, userData: User) => {
        Cookies.set('token', newToken, { expires: 7 }); // 7 days
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        router.push('/dashboard');
    }, [router]);

    const logout = useCallback(() => {
        Cookies.remove('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        router.push('/login');
    }, [router]);

    useEffect(() => {
        // Load token from cookie on mount
        const savedToken = Cookies.get('token');
        if (savedToken) {
            try {
                // Decode token to validate structure
                jwtDecode(savedToken);

                // For now, we rely on localStorage for full user object persistence
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
                setToken(savedToken);
            } catch (error) {
                console.error("Invalid token found, logging out.");
                logout();
            }
        }
        setIsLoading(false);
    }, [logout]);

    // Protect Dashboard Routes
    useEffect(() => {
        if (!isLoading && !user && pathname.startsWith('/dashboard')) {
            router.push('/login');
        }
    }, [user, isLoading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
