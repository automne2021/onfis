import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "manager" | "employee";

export interface AuthUser {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
}

interface AuthContextType {
    currentUser: AuthUser;
    setRole: (role: UserRole) => void;
}

const MOCK_CURRENT_USER: AuthUser = {
    id: "1",
    name: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: "manager",
};

const AuthContext = createContext<AuthContextType>({
    currentUser: MOCK_CURRENT_USER,
    setRole: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser>(MOCK_CURRENT_USER);

    const setRole = (role: UserRole) => {
        setUser((prev) => ({ ...prev, role }));
    };

    return (
        <AuthContext.Provider value={{ currentUser: user, setRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    return useContext(AuthContext);
}
