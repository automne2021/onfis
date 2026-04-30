import { useAuth } from "./useAuth";
import type { UserRole } from "./useAuth";

interface UseRoleReturn {
    role: UserRole | null;
    isSuperAdmin: boolean;
    isManager: boolean;
    isAdmin: boolean;
    isEmployee: boolean;
    /** True for SUPER_ADMIN and MANAGER — use this for UI gates that should let leader act as manager */
    isManagerLike: boolean;
    permissions: string[];
    isAuthLoading: boolean;
}

export function useRole(): UseRoleReturn {
    const { dbUser, isLoading } = useAuth();

    const role = dbUser?.role || null;
    const isSuperAdmin = role === "SUPER_ADMIN";
    const isManager = role === "MANAGER";

    return {
        role,
        isSuperAdmin,
        isManager,
        isAdmin: role === "ADMIN",
        isEmployee: role === "EMPLOYEE",
        isManagerLike: isSuperAdmin || isManager,
        permissions: dbUser?.permissions || [],
        isAuthLoading: isLoading,
    };
}