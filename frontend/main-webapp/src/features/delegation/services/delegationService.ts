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
}

export interface CreateExecutiveRequest {
  title: string;
  description: string;
  assignedTo?: string;
  priority: ExecutiveRequest["priority"];
  targetRole?: ExecutiveRequest["targetRole"];
}

// For now, use Supabase directly since the backend may not have this endpoint yet
import { supabase } from "../../../services/supabaseClient";

export const delegationService = {
  async list(): Promise<ExecutiveRequest[]> {
    const { data, error } = await supabase
      .from("executive_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch executive requests:", error);
      return [];
    }

    return (data || []).map(mapSnakeToCamel);
  },

  async create(req: CreateExecutiveRequest): Promise<ExecutiveRequest | null> {
    // Get current user's tenant_id and user_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: dbUser } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!dbUser) throw new Error("User not found");

    const { data, error } = await supabase
      .from("executive_requests")
      .insert({
        tenant_id: dbUser.tenant_id,
        created_by: user.id,
        assigned_to: req.assignedTo || null,
        title: req.title,
        description: req.description,
        priority: req.priority,
        target_role: req.targetRole || null,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create executive request:", error);
      throw error;
    }

    return data ? mapSnakeToCamel(data) : null;
  },

  async updateStatus(id: string, status: ExecutiveRequest["status"]): Promise<void> {
    const { error } = await supabase
      .from("executive_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Failed to update executive request status:", error);
      throw error;
    }
  },
};

function mapSnakeToCamel(row: Record<string, unknown>): ExecutiveRequest {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    createdBy: row.created_by as string,
    assignedTo: row.assigned_to as string | null,
    title: row.title as string,
    description: (row.description || "") as string,
    priority: row.priority as ExecutiveRequest["priority"],
    status: row.status as ExecutiveRequest["status"],
    targetRole: row.target_role as ExecutiveRequest["targetRole"],
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
