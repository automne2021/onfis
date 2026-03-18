import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentProjectUser } from "../services/projectService";

export type UserRole = "MANAGER" | "EMPLOYEE";

export interface AuthUser {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
    permissions: string[];
}

interface AuthContextType {
    currentUser: AuthUser;
    isAuthLoading: boolean;
}

const INITIAL_USER: AuthUser = {
    id: "",
    name: "",
    avatar: undefined,
    role: "EMPLOYEE",
    permissions: [],
};

const AuthContext = createContext<AuthContextType>({
    currentUser: INITIAL_USER,
    isAuthLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser>(INITIAL_USER);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadCurrentUser = async () => {
            try {
                const me = await getCurrentProjectUser();
                if (!mounted) {
                    return;
                }
                setCurrentUser({
                    id: me.id,
                    name: me.name,
                    avatar: undefined,
                    role: me.role,
                    permissions: me.permissions,
                });
            } catch {
                if (!mounted) {
                    return;
                }
                setCurrentUser(INITIAL_USER);
            } finally {
                if (mounted) {
                    setIsAuthLoading(false);
                }
            }
        };

        void loadCurrentUser();
        return () => {
            mounted = false;
        };
    }, []);

    const contextValue = useMemo(
        () => ({ currentUser, isAuthLoading }),
        [currentUser, isAuthLoading],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    return useContext(AuthContext);
}
