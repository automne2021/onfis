import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { CanonicalRole } from '../utils/roles';

export type UserRole = CanonicalRole;

export interface AuthUser {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
    permissions: string[];
    email?: string;
    departmentId?: string;
}

export interface AuthContextType {
    session: Session | null;
    user: User | null;
    dbUser: AuthUser | null;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};