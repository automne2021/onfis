import { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon";
import { Button } from "../../../components/common/Buttons/Button";
import { adminService } from "../services/adminService";
import type { AuditLog, AuditAction, AuditResult } from "../types/adminTypes";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LOGS: AuditLog[] = [
  { id: "l1", userId: "u2", userName: "Tran Thi Binh", action: "UPDATE_USER_ROLE", targetId: "u5", targetType: "USER", detail: "EMPLOYEE -> MANAGER", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-27T08:15:32Z" },
  { id: "l2", userId: "u2", userName: "Trần Thị Bình", action: "CREATE_USER", targetId: "u7", targetType: "USER", detail: "email: tuan.dang@company.vn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-27T08:10:05Z" },
  { id: "l3", userId: "u2", userName: "Tran Thi Binh", action: "TICKET_APPROVED", targetId: "TK-002", targetType: "TICKET", detail: "Role change for Hoang Minh Tuan", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-26T10:30:00Z" },
  { id: "l4", userId: "u1", userName: "Nguyen Van An", action: "UPDATE_TENANT", targetId: "t1", targetType: "TENANT", detail: "timezone: UTC -> Asia/Ho_Chi_Minh", ipAddress: "10.0.0.1", result: "SUCCESS", timestamp: "2026-04-25T14:00:00Z" },
  { id: "l5", userId: "u2", userName: "Tran Thi Binh", action: "RESET_PASSWORD", targetId: "u4", targetType: "USER", detail: "Reset email sent to phamthic@company.vn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-25T09:45:00Z" },
  { id: "l6", userId: "u2", userName: "Tran Thi Binh", action: "DISABLE_USER", targetId: "u7", targetType: "USER", detail: "Deactivated account of Dang Quoc Tuan", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-24T16:20:00Z" },
  { id: "l7", userId: "u1", userName: "Nguyen Van An", action: "UPDATE_STORAGE_CONFIG", targetId: "t1", targetType: "TENANT", detail: "maxFileSizeMb: 10 -> 50", ipAddress: "10.0.0.1", result: "FAILED", timestamp: "2026-04-24T11:00:00Z" },
  { id: "l8", userId: "u2", userName: "Tran Thi Binh", action: "TICKET_REJECTED", targetId: "TK-001", targetType: "TICKET", detail: "Missing employee details", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-23T15:30:00Z" },
  { id: "l9", userId: "u1", userName: "Nguyen Van An", action: "FORCE_LOGOUT", targetId: "u5", targetType: "USER", detail: "Session revoked", ipAddress: "10.0.0.1", result: "SUCCESS", timestamp: "2026-04-22T10:00:00Z" },
  { id: "l10", userId: "u2", userName: "Trần Thị Bình", action: "DELETE_USER", targetId: "old-u", targetType: "USER", detail: "old.employee@company.vn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-20T08:00:00Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  // Explicit admin-service actions
  UPDATE_USER_ROLE:     { label: "Update Role",          icon: "manage_accounts",     color: "#3B82F6" },
  DELETE_USER:          { label: "Delete Account",       icon: "person_remove",       color: "#EF4444" },
  CREATE_USER:          { label: "Create Account",       icon: "person_add",          color: "#10B981" },
  DISABLE_USER:         { label: "Disable Account",      icon: "block",               color: "#F59E0B" },
  RESET_PASSWORD:       { label: "Reset Password",       icon: "lock_reset",          color: "#8B5CF6" },
  FORCE_LOGOUT:         { label: "Force Logout",         icon: "logout",              color: "#EC4899" },
  UPDATE_TENANT:        { label: "Update Tenant",        icon: "business",            color: "#0014A8" },
  UPDATE_STORAGE_CONFIG:{ label: "Update Storage Config", icon: "storage",            color: "#6366F1" },
  TICKET_APPROVED:      { label: "Approve Ticket",       icon: "check_circle",        color: "#10B981" },
  TICKET_REJECTED:      { label: "Reject Ticket",        icon: "cancel",              color: "#EF4444" },
  DELETE_DEPARTMENT:    { label: "Delete Department",    icon: "domain_disabled",     color: "#EF4444" },
  UPDATE_SYSTEM_CONFIG: { label: "Update System Config", icon: "settings_suggest",    color: "#0014A8" },
  // DB trigger-generated actions (from fn_audit_trigger)
  CREATE_USERS:         { label: "Create User",          icon: "person_add",          color: "#10B981" },
  UPDATE_USERS:         { label: "Update User",          icon: "manage_accounts",     color: "#3B82F6" },
  DELETE_USERS:         { label: "Delete User",          icon: "person_remove",       color: "#EF4444" },
  CREATE_DEPARTMENTS:   { label: "Create Department",    icon: "domain_add",          color: "#10B981" },
  UPDATE_DEPARTMENTS:   { label: "Update Department",    icon: "business",            color: "#6366F1" },
  DELETE_DEPARTMENTS:   { label: "Delete Department",    icon: "domain_disabled",     color: "#EF4444" },
  CREATE_TASKS:         { label: "Create Task",          icon: "add_task",            color: "#10B981" },
  UPDATE_TASKS:         { label: "Update Task",          icon: "edit_note",           color: "#3B82F6" },
  DELETE_TASKS:         { label: "Delete Task",          icon: "delete",              color: "#EF4444" },
  CREATE_PROJECTS:      { label: "Create Project",       icon: "create_new_folder",   color: "#10B981" },
  UPDATE_PROJECTS:      { label: "Update Project",       icon: "folder_managed",      color: "#6366F1" },
  DELETE_PROJECTS:      { label: "Delete Project",       icon: "folder_delete",       color: "#EF4444" },
  CREATE_EXECUTIVE_REQUESTS: { label: "Create Request",  icon: "assignment",          color: "#10B981" },
  UPDATE_EXECUTIVE_REQUESTS: { label: "Update Request",  icon: "assignment_turned_in", color: "#3B82F6" },
  DELETE_EXECUTIVE_REQUESTS: { label: "Delete Request",  icon: "assignment_late",     color: "#EF4444" },
};

const ACTION_FALLBACK = { label: "System Action", icon: "history", color: "#62748E" };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const RESULT_META: Record<AuditResult, { bg: string; text: string; dot: string }> = {
  SUCCESS: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  FAILED:  { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500"   },
};

// ─── Detail panel ─────────────────────────────────────────────────────────────

function LogDetailPanel({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null;
  const m = ACTION_META[log.action] ?? ACTION_FALLBACK;
  const r = RESULT_META[log.result] ?? RESULT_META.SUCCESS;
  return (
    <div className="w-80 shrink-0 section-card p-5 space-y-4 self-start sticky top-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-700">Log Details</p>
        <button type="button" onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
          <Icon name="close" size={14} color="#9CA3AF" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
          <Icon name={m.icon} size={18} color={m.color} />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{m.label}</p>
          <code className="text-[10px] text-neutral-400">{log.action}</code>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {[
          { label: "Actor", value: log.userName || "System" },
          { label: "User ID", value: <code className="text-xs">{log.userId}</code> },
          { label: "Timestamp", value: formatDateTime(log.timestamp) },
          { label: "IP Address", value: <code className="text-xs">{log.ipAddress}</code> },
          { label: "Target", value: log.targetType ? `${log.targetType} #${log.targetId}` : "—" },
          { label: "Detail", value: log.detail || "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="text-neutral-800 font-medium">{value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs text-neutral-400">Result</p>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${r.bg} ${r.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
            {log.result === "SUCCESS" ? "Success" : "Failed"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

let auditLogsSnapshot: AuditLog[] | null = null;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [filterAction, setFilterAction] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async (showLoading = false, forceRefresh = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await adminService.listAuditLogs(
        {
          userId: filterUser || undefined,
          action: filterAction || undefined,
          result: (filterResult as AuditResult) || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          page,
          size: PAGE_SIZE,
        },
        { forceRefresh },
      );
      auditLogsSnapshot = res.logs;
      setLogs(res.logs);
      setTotal(res.total);
    } catch {
      const fallbackLogs = auditLogsSnapshot ?? MOCK_LOGS;
      setLogs(fallbackLogs);
      setTotal(fallbackLogs.length);
    } finally {
      setIsLoading(false);
    }
  }, [filterUser, filterAction, filterResult, dateFrom, dateTo, page]);

  useEffect(() => { void load(true, false); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paged = logs;

  const clearFilters = () => {
    setFilterAction(""); setFilterResult(""); setFilterUser("");
    setDateFrom(""); setDateTo(""); setPage(0);
  };

  return (
    <div className="onfis-section">
      {/* Navbar */}
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <Icon name="manage_search" size={22} color="#0014A8" />
          <div>
            <h1 className="text-base font-bold text-neutral-900">Activity Logs</h1>
            <p className="text-xs text-neutral-500">Audit logs - read-only · {total} records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Icon name="lock" size={12} color="#B45309" />
            Read-only
          </span>
          <Button style="sub" iconLeft={<Icon name="refresh" size={14} color="#62748E" />} title="Refresh" onClick={() => void load(true, true)} />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="person_search" size={14} color="#9CA3AF" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by user..."
            className="pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-44"
            value={filterUser}
            onChange={(e) => { setFilterUser(e.target.value); setPage(0); }}
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-600"
        >
          <option value="">All actions</option>
          {(Object.keys(ACTION_META) as AuditAction[]).map((a) => (
            <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>
          ))}
        </select>
        <select
          value={filterResult}
          onChange={(e) => { setFilterResult(e.target.value); setPage(0); }}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-600"
        >
          <option value="">All results</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        <div className="flex items-center gap-1.5">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="text-neutral-400 text-xs">→</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button type="button" onClick={clearFilters}
          className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1.5 transition-colors">
          Clear filters
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pt-4 pb-6 flex gap-4">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
              <Icon name="search_off" size={40} color="#D1D5DB" />
              <p className="mt-2 text-sm">No logs found.</p>
            </div>
          ) : (
            <>
              <div className="section-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Actor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Detail</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">IP</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">Timestamp</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {paged.map((log) => {
                      const m = ACTION_META[log.action] ?? ACTION_FALLBACK;
                      const r = RESULT_META[log.result] ?? RESULT_META.SUCCESS;
                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-neutral-50 transition-colors cursor-pointer ${selectedLog?.id === log.id ? "bg-primary/4" : ""}`}
                          onClick={() => setSelectedLog((prev) => (prev?.id === log.id ? null : log))}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon name={m.icon} size={14} color={m.color} />
                              <span className="font-medium text-neutral-800">{m.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{log.userName || "System"}</td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell max-w-[180px]">
                            <span className="line-clamp-1">{log.detail || "—"}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-400 hidden lg:table-cell">{log.ipAddress || "—"}</td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden xl:table-cell">{formatDateTime(log.timestamp)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${r.bg} ${r.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                              {log.result === "SUCCESS" ? "OK" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-neutral-500">
                  <p>{total} logs · Page {page + 1}/{totalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50 transition-colors">
                      ← Previous
                    </button>
                    <button type="button" disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50 transition-colors">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Log detail sidebar */}
        {selectedLog && (
          <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </div>
    </div>
  );
}
