import api from "../../../services/api";
import {
  clearCachedResourceByPrefix,
  getCachedResource,
  setCachedResource,
} from "../../../utils/resourceCache";
import type {
  Ticket,
  AdminUser,
  TenantSettings,
  StorageSettings,
  AuditLog,
  OnboardingForm,
} from "../types/adminTypes";

type CacheOptions = {
  forceRefresh?: boolean;
};

type ListUsersParams = {
  departmentId?: string;
  status?: string;
  role?: string;
  page?: number;
  size?: number;
};

type ListAuditParams = {
  userId?: string;
  action?: string;
  result?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

const ADMIN_CACHE_PREFIX = "admin:";
const LIST_CACHE_TTL_MS = 90_000;
const SETTINGS_CACHE_TTL_MS = 300_000;

function serializeParams(params?: Record<string, unknown>): string {
  if (!params) {
    return "default";
  }

  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${String(value)}`);

  return entries.length > 0 ? entries.join("|") : "default";
}

const cacheKeys = {
  tickets: `${ADMIN_CACHE_PREFIX}tickets`,
  ticketById: (id: string) => `${ADMIN_CACHE_PREFIX}ticket:${id}`,
  users: (params?: ListUsersParams) => `${ADMIN_CACHE_PREFIX}users:${serializeParams(params)}`,
  tenant: `${ADMIN_CACHE_PREFIX}tenant`,
  storage: `${ADMIN_CACHE_PREFIX}storage`,
  audit: (params?: ListAuditParams) => `${ADMIN_CACHE_PREFIX}audit:${serializeParams(params)}`,
};

function invalidateTicketCaches() {
  clearCachedResourceByPrefix(cacheKeys.tickets);
  clearCachedResourceByPrefix(`${ADMIN_CACHE_PREFIX}ticket:`);
  clearCachedResourceByPrefix(`${ADMIN_CACHE_PREFIX}audit:`);
}

function invalidateUserCaches() {
  clearCachedResourceByPrefix(`${ADMIN_CACHE_PREFIX}users:`);
  clearCachedResourceByPrefix(`${ADMIN_CACHE_PREFIX}audit:`);
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const adminService = {
  getCachedTickets(): Ticket[] | null {
    return getCachedResource<Ticket[]>(cacheKeys.tickets);
  },

  getCachedUsers(params?: ListUsersParams): { users: AdminUser[]; total: number } | null {
    return getCachedResource<{ users: AdminUser[]; total: number }>(cacheKeys.users(params));
  },

  getCachedTenantSettings(): TenantSettings | null {
    return getCachedResource<TenantSettings>(cacheKeys.tenant);
  },

  getCachedStorageSettings(): StorageSettings | null {
    return getCachedResource<StorageSettings>(cacheKeys.storage);
  },

  getCachedAuditLogs(params?: ListAuditParams): { logs: AuditLog[]; total: number } | null {
    return getCachedResource<{ logs: AuditLog[]; total: number }>(cacheKeys.audit(params));
  },

  // Tickets
  async listTickets(options?: CacheOptions): Promise<Ticket[]> {
    if (!options?.forceRefresh) {
      const cached = getCachedResource<Ticket[]>(cacheKeys.tickets);
      if (cached) {
        return cached;
      }
    }

    const res = await api.get<Ticket[]>("/admin/tickets");
    setCachedResource(cacheKeys.tickets, res.data, LIST_CACHE_TTL_MS);
    return res.data;
  },

  async getTicket(id: string, options?: CacheOptions): Promise<Ticket> {
    const key = cacheKeys.ticketById(id);
    if (!options?.forceRefresh) {
      const cached = getCachedResource<Ticket>(key);
      if (cached) {
        return cached;
      }
    }

    const res = await api.get<Ticket>(`/admin/tickets/${id}`);
    setCachedResource(key, res.data, LIST_CACHE_TTL_MS);
    return res.data;
  },

  async acceptTicket(id: string): Promise<void> {
    await api.post(`/admin/tickets/${id}/accept`);
    invalidateTicketCaches();
  },

  async approveTicket(id: string): Promise<void> {
    await api.post(`/admin/tickets/${id}/approve`);
    invalidateTicketCaches();
  },

  async rejectTicket(id: string, reason: string): Promise<void> {
    await api.post(`/admin/tickets/${id}/reject`, { reason });
    invalidateTicketCaches();
  },

  async addTicketComment(
    id: string,
    content: string,
    isInternal: boolean
  ): Promise<void> {
    await api.post(`/admin/tickets/${id}/comments`, { content, isInternal });
    invalidateTicketCaches();
  },

  // Users
  async listUsers(
    params?: ListUsersParams,
    options?: CacheOptions
  ): Promise<{ users: AdminUser[]; total: number }> {
    const key = cacheKeys.users(params);
    if (!options?.forceRefresh) {
      const cached = getCachedResource<{ users: AdminUser[]; total: number }>(key);
      if (cached) {
        return cached;
      }
    }

    const res = await api.get<{ users: AdminUser[]; total: number }>(
      "/admin/users",
      { params }
    );
    setCachedResource(key, res.data, LIST_CACHE_TTL_MS);
    return res.data;
  },

  async createUser(form: OnboardingForm): Promise<AdminUser> {
    const res = await api.post<AdminUser>("/admin/users", form);
    invalidateUserCaches();
    return res.data;
  },

  async updateUserRole(
    userId: string,
    role: AdminUser["role"]
  ): Promise<void> {
    await api.patch(`/admin/users/${userId}/role`, { role });
    invalidateUserCaches();
  },

  async disableUser(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/disable`);
    invalidateUserCaches();
  },

  async enableUser(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/enable`);
    invalidateUserCaches();
  },

  async resetPassword(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/reset-password`);
    invalidateUserCaches();
  },

  async forceLogout(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/force-logout`);
    invalidateUserCaches();
  },

  // Tenant Settings
  async getTenantSettings(options?: CacheOptions): Promise<TenantSettings> {
    if (!options?.forceRefresh) {
      const cached = getCachedResource<TenantSettings>(cacheKeys.tenant);
      if (cached) {
        return cached;
      }
    }

    const res = await api.get<TenantSettings>("/admin/tenant");
    setCachedResource(cacheKeys.tenant, res.data, SETTINGS_CACHE_TTL_MS);
    return res.data;
  },

  async updateTenantSettings(
    settings: Partial<TenantSettings>
  ): Promise<TenantSettings> {
    const res = await api.put<TenantSettings>("/admin/tenant", settings);
    setCachedResource(cacheKeys.tenant, res.data, SETTINGS_CACHE_TTL_MS);
    clearCachedResourceByPrefix(`${ADMIN_CACHE_PREFIX}audit:`);
    return res.data;
  },

  // Storage Settings
  async getStorageSettings(options?: CacheOptions): Promise<StorageSettings> {
    if (!options?.forceRefresh) {
      const cached = getCachedResource<StorageSettings>(cacheKeys.storage);
      if (cached) {
        return cached;
      }
    }

    const res = await api.get<StorageSettings>("/admin/storage");
    setCachedResource(cacheKeys.storage, res.data, SETTINGS_CACHE_TTL_MS);
    return res.data;
  },

  async updateStorageSettings(
    settings: Partial<StorageSettings>
  ): Promise<StorageSettings> {
    const res = await api.put<StorageSettings>("/admin/storage", settings);
    setCachedResource(cacheKeys.storage, res.data, SETTINGS_CACHE_TTL_MS);
    clearCachedResourceByPrefix(`${ADMIN_CACHE_PREFIX}audit:`);
    return res.data;
  },

  // Audit Logs
  async listAuditLogs(
    params?: ListAuditParams,
    options?: CacheOptions
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const key = cacheKeys.audit(params);
    if (!options?.forceRefresh) {
      const cached = getCachedResource<{ logs: AuditLog[]; total: number }>(key);
      if (cached) {
        return cached;
      }
    }

    const res = await api.get<{ logs: AuditLog[]; total: number }>(
      "/admin/audit-logs",
      { params }
    );
    setCachedResource(key, res.data, LIST_CACHE_TTL_MS);
    return res.data;
  },
};
