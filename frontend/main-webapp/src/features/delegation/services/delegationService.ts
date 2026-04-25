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

// For now, use Supabase directly since the backend may not have this endpoint yet
import { supabase } from "../../../services/supabaseClient";

export const delegationService = {
  async list(): Promise<ExecutiveRequest[]> {
    const { data, error } = await supabase
      .from("executive_requests")
      .select(`
        *,
        executive_request_assignees (
          user_id,
          users:user_id ( id, first_name, last_name, email, role, avatar_url )
        )
      `)
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

    // Create the executive request
    const { data, error } = await supabase
      .from("executive_requests")
      .insert({
        tenant_id: dbUser.tenant_id,
        created_by: user.id,
        assigned_to: req.assigneeIds.length === 1 ? req.assigneeIds[0] : null,
        title: req.title,
        description: req.description,
        priority: req.priority,
        target_role: null,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create executive request:", error);
      throw error;
    }

    if (!data) return null;

    // Insert assignees into junction table
    if (req.assigneeIds.length > 0) {
      const assigneeRows = req.assigneeIds.map((userId) => ({
        request_id: data.id,
        user_id: userId,
      }));

      const { error: assigneeError } = await supabase
        .from("executive_request_assignees")
        .insert(assigneeRows);

      if (assigneeError) {
        console.error("Failed to insert assignees:", assigneeError);
      }
    }

    // Re-fetch with assignees
    const { data: full } = await supabase
      .from("executive_requests")
      .select(`
        *,
        executive_request_assignees (
          user_id,
          users:user_id ( id, first_name, last_name, email, role, avatar_url )
        )
      `)
      .eq("id", data.id)
      .single();

    return full ? mapSnakeToCamel(full) : mapSnakeToCamel(data);
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

  async delete(id: string): Promise<void> {
    // Delete assignees first (though foreign key cascade might handle this, it's safer to explicitly delete or rely on cascade if configured)
    await supabase
      .from("executive_request_assignees")
      .delete()
      .eq("request_id", id);

    const { error } = await supabase
      .from("executive_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete executive request:", error);
      throw error;
    }
  },

  /** Fetch users with ADMIN or MANAGER role in the same tenant */
  async listAssignableUsers(): Promise<AssigneeUser[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: dbUser } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!dbUser) return [];

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role, avatar_url")
      .eq("tenant_id", dbUser.tenant_id)
      .in("role", ["ADMIN", "MANAGER"])
      .eq("is_active", true)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Failed to fetch assignable users:", error);
      return [];
    }

    return (data || []).map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url,
    }));
  },
};

function mapSnakeToCamel(row: Record<string, unknown>): ExecutiveRequest {
  // Extract assignees from the joined data
  const rawAssignees = (row.executive_request_assignees as Array<Record<string, unknown>>) || [];
  const assignees: AssigneeUser[] = rawAssignees
    .map((a) => {
      const u = a.users as Record<string, unknown> | null;
      if (!u) return null;
      return {
        id: u.id as string,
        firstName: u.first_name as string | null,
        lastName: u.last_name as string | null,
        email: u.email as string,
        role: u.role as string,
        avatarUrl: u.avatar_url as string | null,
      };
    })
    .filter(Boolean) as AssigneeUser[];

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
    assignees,
  };
}
