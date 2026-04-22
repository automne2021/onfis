import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { getCurrentProjectUser } from "../services/projectService";
import { getCurrentUser } from '../services/authService';

export type UserRole = "MANAGER" | "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
    permissions: string[];
    email?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;          
    dbUser: AuthUser | null;     
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
              if (mounted) setDbUser(null);
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
        isLoading
    }), [session, user, dbUser, isLoading]);

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};