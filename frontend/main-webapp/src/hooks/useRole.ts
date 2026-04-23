import { useAuth } from "./useAuth";
import type { UserRole } from "./useAuth";

interface UseRoleReturn {
    role: UserRole | null;
    isManager: boolean;
    isAdmin: boolean;
    isEmployee: boolean;
    permissions: string[];
    isAuthLoading: boolean;
}

export function useRole(): UseRoleReturn {
    const { dbUser, isLoading } = useAuth();

    const role = dbUser?.role || null;

    return {
        role,
        isManager: role === "MANAGER",
        isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
        isEmployee: role === "EMPLOYEE",
        permissions: dbUser?.permissions || [],
        isAuthLoading: isLoading,
    };
}