import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../contexts/AuthContext";

interface UseRoleReturn {
    role: UserRole;
    isManager: boolean;
    isEmployee: boolean;
    permissions: string[];
    isAuthLoading: boolean;
}

export function useRole(): UseRoleReturn {
    const { currentUser, isAuthLoading } = useAuth();
    return {
        role: currentUser.role,
        isManager: currentUser.role === "MANAGER",
        isEmployee: currentUser.role === "EMPLOYEE",
        permissions: currentUser.permissions,
        isAuthLoading,
    };
}
