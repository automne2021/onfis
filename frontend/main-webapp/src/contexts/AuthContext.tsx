import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "MANAGER" | "EMPLOYEE";

export interface AuthUser {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
}

interface AuthContextType {
    currentUser: AuthUser;
    toggleRole: () => void;
}

const INITIAL_USER: AuthUser = {
    id: "1",
    name: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: "MANAGER",
};

const AuthContext = createContext<AuthContextType>({
    currentUser: INITIAL_USER,
    toggleRole: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser>(INITIAL_USER);

    const toggleRole = () => {
        setCurrentUser((prev) => ({
            ...prev,
            role: prev.role === "MANAGER" ? "EMPLOYEE" : "MANAGER",
        }));
    };

    return (
        <AuthContext.Provider value={{ currentUser, toggleRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    return useContext(AuthContext);
}
