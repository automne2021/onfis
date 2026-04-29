import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/common/Icon";
import { useTenantPath } from "../../../hooks/useTenantPath";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STATS = {
  totalUsers: 47,
  activeUsers: 42,
  inactiveUsers: 3,
  suspended: 2,
  pendingTickets: 5,
  resolvedToday: 3,
  totalDepts: 7,
  newThisMonth: 4,
};

const MOCK_RECENT_TICKETS = [
  { id: "1", code: "TK-001", title: "Add New Employee Accounts - Engineering Department", priority: "HIGH", status: "PENDING", requester: "CEO User", createdAt: "2026-04-25T08:30:00Z" },
  { id: "2", code: "TK-002", title: "Promote Hoang Minh Tuan to Manager", priority: "MEDIUM", status: "IN_PROGRESS", requester: "CEO User", createdAt: "2026-04-24T14:00:00Z" },
  { id: "3", code: "TK-004", title: "Increase File Upload Size Limit", priority: "LOW", status: "PENDING", requester: "CEO User", createdAt: "2026-04-27T07:00:00Z" },
];

const MOCK_RECENT_AUDIT = [
  { id: "a1", action: "CREATE_USER", actor: "Admin", target: "trantha@company.vn", ts: "2026-04-27T09:10:00Z" },
  { id: "a2", action: "UPDATE_USER_ROLE", actor: "Admin", target: "cuong.le@company.vn -> MANAGER", ts: "2026-04-26T16:45:00Z" },
  { id: "a3", action: "DISABLE_USER", actor: "Admin", target: "em.hoang@company.vn", ts: "2026-04-26T10:00:00Z" },
  { id: "a4", action: "UPDATE_SETTINGS", actor: "Admin", target: "Timezone configuration", ts: "2026-04-25T14:30:00Z" },
  { id: "a5", action: "RESET_PASSWORD", actor: "Admin", target: "dung.pham@company.vn", ts: "2026-04-24T11:20:00Z" },
];

const MOCK_ROLE_DIST = [
  { role: "SUPER_ADMIN", count: 1, color: "#7C3AED" },
  { role: "ADMIN", count: 2, color: "#0014A8" },
  { role: "MANAGER", count: 8, color: "#2563EB" },
  { role: "EMPLOYEE", count: 36, color: "#64748B" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { label: string; bg: string; text: string }> = {
  CRITICAL: { label: "Critical", bg: "bg-red-50", text: "text-red-700" },
  HIGH: { label: "High", bg: "bg-orange-50", text: "text-orange-700" },
  MEDIUM: { label: "Medium", bg: "bg-yellow-50", text: "text-yellow-700" },
  LOW: { label: "Low", bg: "bg-neutral-100", text: "text-neutral-500" },
};

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  PENDING: { label: "Pending", dot: "bg-yellow-400", text: "text-yellow-700" },
  IN_PROGRESS: { label: "In Progress", dot: "bg-blue-500", text: "text-blue-700" },
  RESOLVED: { label: "Resolved", dot: "bg-green-500", text: "text-green-700" },
  REJECTED: { label: "Rejected", dot: "bg-red-400", text: "text-red-600" },
};

const AUDIT_ACTION_META: Record<string, { icon: string; label: string; color: string }> = {
  CREATE_USER: { icon: "person_add", label: "Create User", color: "#0014A8" },
  UPDATE_USER_ROLE: { icon: "manage_accounts", label: "Update User Role", color: "#7C3AED" },
  DISABLE_USER: { icon: "block", label: "Disable User", color: "#EF4444" },
  UPDATE_SETTINGS: { icon: "settings", label: "Update Settings", color: "#F59E0B" },
  RESET_PASSWORD: { icon: "lock_reset", label: "Reset Password", color: "#0EA5E9" },
  DELETE_USER: { icon: "person_remove", label: "Delete User", color: "#EF4444" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color, onClick,
}: {
  icon: string; label: string; value: number | string; sub?: string; color: string; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 bg-white rounded-xl border border-neutral-100 shadow-sm px-5 py-4 w-full text-left transition-all duration-150 ${onClick ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "cursor-default"}`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon name={icon} size={20} color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-neutral-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-neutral-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { withTenant } = useTenantPath();
  const navigate = useNavigate();
  const [_tab, _setTab] = useState("overview");

  const totalRoles = MOCK_ROLE_DIST.reduce((s, r) => s + r.count, 0);

  return (
    <div className="onfis-section">
      {/* Header */}
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="admin_panel_settings" size={20} color="#0014A8" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900">Admin Dashboard</h1>
            <p className="text-xs text-neutral-500">System overview and administration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(withTenant("/admin/users"))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Icon name="person_add" size={14} color="#fff" />
            Add Employee
          </button>
          <button
            type="button"
            onClick={() => navigate(withTenant("/admin/requests"))}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Icon name="support_agent" size={14} color="#62748E" />
            Requests
            {MOCK_STATS.pendingTickets > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {MOCK_STATS.pendingTickets}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon="group" label="Total Accounts" value={MOCK_STATS.totalUsers}
            sub={`+${MOCK_STATS.newThisMonth} this month`} color="#0014A8"
            onClick={() => navigate(withTenant("/admin/users"))}
          />
          <StatCard
            icon="check_circle" label="Active Accounts" value={MOCK_STATS.activeUsers}
            sub={`${Math.round((MOCK_STATS.activeUsers / MOCK_STATS.totalUsers) * 100)}% of total`} color="#00A63E"
          />
          <StatCard
            icon="pending_actions" label="Pending Requests" value={MOCK_STATS.pendingTickets}
            sub={`${MOCK_STATS.resolvedToday} resolved today`} color="#F59E0B"
            onClick={() => navigate(withTenant("/admin/requests"))}
          />
          <StatCard
            icon="account_tree" label="Departments" value={MOCK_STATS.totalDepts}
            color="#7C3AED"
            onClick={() => navigate(withTenant("/admin/users"))}
          />
        </div>

        {/* Main content: tickets + audit */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Pending tickets */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Icon name="support_agent" size={16} color="#0014A8" />
                <h2 className="text-sm font-semibold text-neutral-800">Recent Requests</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(withTenant("/admin/requests"))}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-neutral-50">
              {MOCK_RECENT_TICKETS.map((ticket) => (
                <div key={ticket.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-neutral-400">{ticket.code}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_META[ticket.priority].bg} ${PRIORITY_META[ticket.priority].text}`}>
                        {PRIORITY_META[ticket.priority].label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-800 truncate max-w-sm">{ticket.title}</p>
                    <p className="text-[11px] text-neutral-400">From {ticket.requester} - {timeAgo(ticket.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[ticket.status].dot}`} />
                    <span className={`text-[11px] font-medium ${STATUS_META[ticket.status].text}`}>
                      {STATUS_META[ticket.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role distribution */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-neutral-100">
              <Icon name="pie_chart" size={16} color="#0014A8" />
              <h2 className="text-sm font-semibold text-neutral-800">Role Distribution</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {MOCK_ROLE_DIST.map((item) => {
                const pct = Math.round((item.count / totalRoles) * 100);
                return (
                  <div key={item.role}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-neutral-700">{item.role}</span>
                      <span className="text-xs text-neutral-500">{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-neutral-100">
                <p className="text-[11px] text-neutral-400 text-center">{totalRoles} accounts - {MOCK_STATS.totalDepts} departments</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="px-5 pb-4">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Quick Actions</p>
              <div className="space-y-1.5">
                {[
                  { icon: "group", label: "Manage users", path: "/admin/users" },
                  { icon: "tune", label: "System settings", path: "/admin/system" },
                  { icon: "manage_search", label: "View audit logs", path: "/admin/audit" },
                ].map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(withTenant(item.path))}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Icon name={item.icon} size={14} color="#62748E" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent audit log */}
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Icon name="manage_search" size={16} color="#0014A8" />
              <h2 className="text-sm font-semibold text-neutral-800">Recent System Activity</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(withTenant("/admin/audit"))}
              className="text-xs text-primary hover:underline font-medium"
            >
              View full log
            </button>
          </div>
          <div className="divide-y divide-neutral-50">
            {MOCK_RECENT_AUDIT.map((log) => {
              const meta = AUDIT_ACTION_META[log.action] ?? { icon: "history", label: log.action, color: "#62748E" };
              return (
                <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                    <Icon name={meta.icon} size={15} color={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">{meta.label}</p>
                    <p className="text-xs text-neutral-500 truncate">{log.target}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-neutral-400">{timeAgo(log.ts)}</p>
                    <p className="text-[11px] text-neutral-500 font-medium">{log.actor}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
