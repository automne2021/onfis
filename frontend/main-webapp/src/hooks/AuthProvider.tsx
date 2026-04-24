import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { getCurrentUser } from '../services/authService';
import { AuthContext, type AuthUser, type UserRole } from './useAuth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchDatabaseUser = async (supabaseUser: User | null) => {
            if (!supabaseUser) {
                if (mounted) setDbUser(null);
                return;
            }
            try {
                console.log("Starting to fetch DB user for ID:", supabaseUser.id);
                const me = await getCurrentUser();
                console.log("Fetch DB user success:", me);
                if (mounted) {
                    setDbUser({
                        id: me.id,
                        name: me.name,
                        avatar: undefined,
                        role: me.role as UserRole,
                        permissions: me.permissions || [],
                    });
                }
            } catch (error) {
                console.error("Failed to load project user profile:", error);
                // Fallback: read role from Supabase user metadata
                // This allows the UI to function when the backend API is unavailable
                const meta = supabaseUser.user_metadata;
                if (mounted && meta?.role) {
                    console.warn("Using Supabase metadata fallback for role:", meta.role);
                    setDbUser({
                        id: supabaseUser.id,
                        name: meta.username || supabaseUser.email?.split("@")[0] || "User",
                        avatar: undefined,
                        role: meta.role as UserRole,
                        permissions: [],
                    });
                } else if (mounted) {
                    setDbUser(null);
                }
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                void fetchDatabaseUser(currentUser).finally(() => {
                    if (mounted) setIsLoading(false);
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                void fetchDatabaseUser(currentUser);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({
        session,
        user,
        dbUser,
        isLoading,
    }), [session, user, dbUser, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
