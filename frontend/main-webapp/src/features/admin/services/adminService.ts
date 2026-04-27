import api from "../../../services/api";
import type {
  Ticket,
  AdminUser,
  TenantSettings,
  StorageSettings,
  AuditLog,
  OnboardingForm,
} from "../types/adminTypes";

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const adminService = {
  // Tickets
  async listTickets(): Promise<Ticket[]> {
    const res = await api.get<Ticket[]>("/admin/tickets");
    return res.data;
  },

  async getTicket(id: string): Promise<Ticket> {
    const res = await api.get<Ticket>(`/admin/tickets/${id}`);
    return res.data;
  },

  async approveTicket(id: string): Promise<void> {
    await api.post(`/admin/tickets/${id}/approve`);
  },

  async rejectTicket(id: string, reason: string): Promise<void> {
    await api.post(`/admin/tickets/${id}/reject`, { reason });
  },

  async addTicketComment(
    id: string,
    content: string,
    isInternal: boolean
  ): Promise<void> {
    await api.post(`/admin/tickets/${id}/comments`, { content, isInternal });
  },

  // Users
  async listUsers(params?: {
    departmentId?: string;
    status?: string;
    role?: string;
    page?: number;
    size?: number;
  }): Promise<{ users: AdminUser[]; total: number }> {
    const res = await api.get<{ users: AdminUser[]; total: number }>(
      "/admin/users",
      { params }
    );
    return res.data;
  },

  async createUser(form: OnboardingForm): Promise<AdminUser> {
    const res = await api.post<AdminUser>("/admin/users", form);
    return res.data;
  },

  async updateUserRole(
    userId: string,
    role: AdminUser["role"]
  ): Promise<void> {
    await api.patch(`/admin/users/${userId}/role`, { role });
  },

  async disableUser(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/disable`);
  },

  async enableUser(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/enable`);
  },

  async resetPassword(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/reset-password`);
  },

  async forceLogout(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/force-logout`);
  },

  // Tenant Settings
  async getTenantSettings(): Promise<TenantSettings> {
    const res = await api.get<TenantSettings>("/admin/tenant");
    return res.data;
  },

  async updateTenantSettings(
    settings: Partial<TenantSettings>
  ): Promise<TenantSettings> {
    const res = await api.put<TenantSettings>("/admin/tenant", settings);
    return res.data;
  },

  // Storage Settings
  async getStorageSettings(): Promise<StorageSettings> {
    const res = await api.get<StorageSettings>("/admin/storage");
    return res.data;
  },

  async updateStorageSettings(
    settings: Partial<StorageSettings>
  ): Promise<StorageSettings> {
    const res = await api.put<StorageSettings>("/admin/storage", settings);
    return res.data;
  },

  // Audit Logs
  async listAuditLogs(params?: {
    userId?: string;
    action?: string;
    result?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const res = await api.get<{ logs: AuditLog[]; total: number }>(
      "/admin/audit-logs",
      { params }
    );
    return res.data;
  },
};
