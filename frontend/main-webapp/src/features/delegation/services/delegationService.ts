export interface ExecutiveRequest {
  id: string;
  tenantId: string;
  createdBy: string;
  assignedTo: string | null;
  title: string;
  description: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  targetRole: "ADMIN" | "MANAGER" | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** New: list of assigned user IDs from junction table */
  assignees: AssigneeUser[];
  /** Internal notes / comments added by admin */
  comments: DelegationComment[];
}

export interface DelegationComment {
  id: string;
  authorId: string;
  authorName: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface AssigneeUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export interface CreateExecutiveRequest {
  title: string;
  description: string;
  priority: ExecutiveRequest["priority"];
  /** New: array of user IDs to assign */
  assigneeIds: string[];
}

import api from "../../../services/api";

export const delegationService = {
  async list(): Promise<ExecutiveRequest[]> {
    const res = await api.get<ExecutiveRequest[]>("/admin/delegations");
    return res.data;
  },

  async create(req: CreateExecutiveRequest): Promise<ExecutiveRequest | null> {
    const res = await api.post<ExecutiveRequest>("/admin/delegations", req);
    return res.data ?? null;
  },

  async updateStatus(id: string, status: ExecutiveRequest["status"]): Promise<void> {
    await api.patch(`/admin/delegations/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/delegations/${id}`);
  },

  /** Fetch users with ADMIN or MANAGER role in the same tenant */
  async listAssignableUsers(): Promise<AssigneeUser[]> {
    const res = await api.get<AssigneeUser[]>("/admin/delegations/assignable-users");
    return res.data;
  },

  /** Add an internal note to a delegation (reuses the tickets comment endpoint — same table) */
  async addNote(delegationId: string, content: string): Promise<void> {
    await api.post(`/admin/tickets/${delegationId}/comments`, { content, isInternal: true });
  },
};
