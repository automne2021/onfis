import { createContext, useContext, type ReactNode } from "react";

export interface AuthUser {
    id: string;
    name: string;
    avatar?: string;
}

interface AuthContextType {
    currentUser: AuthUser;
}

// Mock current user — replace with real auth integration later
const MOCK_CURRENT_USER: AuthUser = {
    id: "1",
    name: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
};

const AuthContext = createContext<AuthContextType>({
    currentUser: MOCK_CURRENT_USER,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <AuthContext.Provider value={{ currentUser: MOCK_CURRENT_USER }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    return useContext(AuthContext);
}
