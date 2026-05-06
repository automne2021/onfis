import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { getCurrentUser } from '../services/authService';
import { normalizeRole } from '../utils/roles';
import { AuthContext, type AuthUser } from './useAuth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
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
                const me = await getCurrentUser();
                const normalizedRole = normalizeRole(me?.role);
                if (!normalizedRole) {
                    throw new Error(`Unsupported role value: ${String(me?.role)}`);
                }

                if (mounted) {
                    setDbUser({
                        id: me.id,
                        name: `${me.firstName || ''} ${me.lastName || ''}`.trim() || "N/A",
                        avatar: undefined,
                        role: normalizedRole,
                        permissions: Array.isArray(me.permissions) ? me.permissions : [],
                        departmentId: me.departmentId,
                        email: me.email,
                    });
                }
            } catch (error) {
                console.error("Failed to load project user profile:", error);
                if (mounted) {
                    setDbUser(null);
                }
            }
        };

        const syncAuthState = async (nextSession: Session | null) => {
            if (!mounted) {
                return;
            }

            setSession(nextSession);
            const currentUser = nextSession?.user ?? null;
            setUser(currentUser);
            setIsLoading(true);

            await fetchDatabaseUser(currentUser);

            if (mounted) {
                setIsLoading(false);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            void syncAuthState(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            void syncAuthState(session);
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
