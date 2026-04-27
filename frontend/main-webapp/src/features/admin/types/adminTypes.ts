// ─── Tickets / Request Center ────────────────────────────────────────────────

export type TicketStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketCategory =
  | "ADD_ACCOUNT"
  | "CHANGE_ROLE"
  | "SYSTEM_CONFIG"
  | "STORAGE"
  | "OTHER";

export interface TicketComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assigneeId?: string;
  assigneeName?: string;
  comments: TicketComment[];
  payload?: Record<string, unknown>;
}

// ─── User Management ─────────────────────────────────────────────────────────

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";
  department?: string;
  departmentId?: string;
  position?: string;
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface OnboardingForm {
  email: string;
}

// ─── System Settings ──────────────────────────────────────────────────────────

export interface TenantSettings {
  id: string;
  name: string;
  legalName: string;
  taxCode: string;
  address: string;
  timezone: string;
  dateFormat: string;
  workingDays: string[];
  publicHolidays: { date: string; name: string }[];
  logoUrl?: string;
}

export interface StorageSettings {
  totalQuotaMb: number;
  usedMb: number;
  maxFileSizeMb: number;
  allowedExtensions: string[];
  bucketName: string;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type AuditAction =
  | "UPDATE_USER_ROLE"
  | "DELETE_USER"
  | "CREATE_USER"
  | "DISABLE_USER"
  | "RESET_PASSWORD"
  | "FORCE_LOGOUT"
  | "UPDATE_TENANT"
  | "UPDATE_STORAGE_CONFIG"
  | "TICKET_APPROVED"
  | "TICKET_REJECTED"
  | "DELETE_DEPARTMENT"
  | "UPDATE_SYSTEM_CONFIG";

export type AuditResult = "SUCCESS" | "FAILED";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  targetId?: string;
  targetType?: string;
  detail?: string;
  ipAddress: string;
  result: AuditResult;
  timestamp: string;
}
