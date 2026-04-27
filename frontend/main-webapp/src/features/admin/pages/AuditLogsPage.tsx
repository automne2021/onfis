import { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon";
import { Button } from "../../../components/common/Buttons/Button";
import { adminService } from "../services/adminService";
import type { AuditLog, AuditAction, AuditResult } from "../types/adminTypes";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LOGS: AuditLog[] = [
  { id: "l1", userId: "u2", userName: "Trần Thị Bình", action: "UPDATE_USER_ROLE", targetId: "u5", targetType: "USER", detail: "EMPLOYEE → MANAGER", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-27T08:15:32Z" },
  { id: "l2", userId: "u2", userName: "Trần Thị Bình", action: "CREATE_USER", targetId: "u7", targetType: "USER", detail: "email: tuan.dang@company.vn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-27T08:10:05Z" },
  { id: "l3", userId: "u2", userName: "Trần Thị Bình", action: "TICKET_APPROVED", targetId: "TK-002", targetType: "TICKET", detail: "Đổi quyền Hoàng Minh Tuấn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-26T10:30:00Z" },
  { id: "l4", userId: "u1", userName: "Nguyễn Văn An", action: "UPDATE_TENANT", targetId: "t1", targetType: "TENANT", detail: "timezone: UTC → Asia/Ho_Chi_Minh", ipAddress: "10.0.0.1", result: "SUCCESS", timestamp: "2026-04-25T14:00:00Z" },
  { id: "l5", userId: "u2", userName: "Trần Thị Bình", action: "RESET_PASSWORD", targetId: "u4", targetType: "USER", detail: "Email reset gửi đến phamthic@company.vn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-25T09:45:00Z" },
  { id: "l6", userId: "u2", userName: "Trần Thị Bình", action: "DISABLE_USER", targetId: "u7", targetType: "USER", detail: "Khóa tài khoản Đặng Quốc Tuấn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-24T16:20:00Z" },
  { id: "l7", userId: "u1", userName: "Nguyễn Văn An", action: "UPDATE_STORAGE_CONFIG", targetId: "t1", targetType: "TENANT", detail: "maxFileSizeMb: 10 → 50", ipAddress: "10.0.0.1", result: "FAILED", timestamp: "2026-04-24T11:00:00Z" },
  { id: "l8", userId: "u2", userName: "Trần Thị Bình", action: "TICKET_REJECTED", targetId: "TK-001", targetType: "TICKET", detail: "Thiếu thông tin nhân viên", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-23T15:30:00Z" },
  { id: "l9", userId: "u1", userName: "Nguyễn Văn An", action: "FORCE_LOGOUT", targetId: "u5", targetType: "USER", detail: "Phiên đăng nhập bị thu hồi", ipAddress: "10.0.0.1", result: "SUCCESS", timestamp: "2026-04-22T10:00:00Z" },
  { id: "l10", userId: "u2", userName: "Trần Thị Bình", action: "DELETE_USER", targetId: "old-u", targetType: "USER", detail: "old.employee@company.vn", ipAddress: "192.168.1.10", result: "SUCCESS", timestamp: "2026-04-20T08:00:00Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_META: Record<AuditAction, { label: string; icon: string; color: string }> = {
  UPDATE_USER_ROLE:     { label: "Đổi vai trò",         icon: "manage_accounts",     color: "#3B82F6" },
  DELETE_USER:          { label: "Xóa tài khoản",        icon: "person_remove",       color: "#EF4444" },
  CREATE_USER:          { label: "Tạo tài khoản",        icon: "person_add",          color: "#10B981" },
  DISABLE_USER:         { label: "Khóa tài khoản",       icon: "block",               color: "#F59E0B" },
  RESET_PASSWORD:       { label: "Reset mật khẩu",       icon: "lock_reset",          color: "#8B5CF6" },
  FORCE_LOGOUT:         { label: "Buộc đăng xuất",       icon: "logout",              color: "#EC4899" },
  UPDATE_TENANT:        { label: "Cập nhật tenant",      icon: "business",            color: "#0014A8" },
  UPDATE_STORAGE_CONFIG:{ label: "Cấu hình lưu trữ",    icon: "storage",             color: "#6366F1" },
  TICKET_APPROVED:      { label: "Duyệt ticket",         icon: "check_circle",        color: "#10B981" },
  TICKET_REJECTED:      { label: "Từ chối ticket",       icon: "cancel",              color: "#EF4444" },
  DELETE_DEPARTMENT:    { label: "Xóa phòng ban",        icon: "domain_disabled",     color: "#EF4444" },
  UPDATE_SYSTEM_CONFIG: { label: "Cấu hình hệ thống",   icon: "settings_suggest",    color: "#0014A8" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
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
  const m = ACTION_META[log.action];
  const r = RESULT_META[log.result];
  return (
    <div className="w-80 shrink-0 section-card p-5 space-y-4 self-start sticky top-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-700">Chi tiết log</p>
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
          { label: "Người thực hiện", value: log.userName },
          { label: "User ID", value: <code className="text-xs">{log.userId}</code> },
          { label: "Timestamp", value: formatDateTime(log.timestamp) },
          { label: "IP Address", value: <code className="text-xs">{log.ipAddress}</code> },
          { label: "Đối tượng", value: log.targetType ? `${log.targetType} #${log.targetId}` : "—" },
          { label: "Chi tiết", value: log.detail || "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="text-neutral-800 font-medium">{value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs text-neutral-400">Kết quả</p>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${r.bg} ${r.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
            {log.result === "SUCCESS" ? "Thành công" : "Thất bại"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [filterAction, setFilterAction] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.listAuditLogs();
      setLogs(res.logs);
    } catch {
      setLogs(MOCK_LOGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = logs.filter((l) => {
    const matchAction = !filterAction || l.action === filterAction;
    const matchResult = !filterResult || l.result === filterResult;
    const matchUser = !filterUser || l.userName.toLowerCase().includes(filterUser.toLowerCase()) || l.userId.includes(filterUser);
    const ts = l.timestamp;
    const matchFrom = !dateFrom || ts >= dateFrom;
    const matchTo = !dateTo || ts <= dateTo + "T23:59:59Z";
    return matchAction && matchResult && matchUser && matchFrom && matchTo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

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
            <h1 className="text-base font-bold text-neutral-900">Nhật ký hoạt động</h1>
            <p className="text-xs text-neutral-500">Audit logs – Chỉ đọc · {logs.length} bản ghi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Icon name="lock" size={12} color="#B45309" />
            Read-only
          </span>
          <Button style="sub" iconLeft={<Icon name="refresh" size={14} color="#62748E" />} title="Làm mới" onClick={() => void load()} />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="person_search" size={14} color="#9CA3AF" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc người dùng..."
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
          <option value="">Tất cả hành động</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>
          ))}
        </select>
        <select
          value={filterResult}
          onChange={(e) => { setFilterResult(e.target.value); setPage(0); }}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-600"
        >
          <option value="">Tất cả kết quả</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILED">Thất bại</option>
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
          Xóa bộ lọc
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
              <Icon name="search_off" size={40} color="#D1D5DB" />
              <p className="mt-2 text-sm">Không tìm thấy log nào.</p>
            </div>
          ) : (
            <>
              <div className="section-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hành động</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Người thực hiện</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Chi tiết</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">IP</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">Timestamp</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {paged.map((log) => {
                      const m = ACTION_META[log.action];
                      const r = RESULT_META[log.result];
                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-neutral-50 transition-colors cursor-pointer ${selectedLog?.id === log.id ? "bg-primary/4" : ""}`}
                          onClick={() => setSelectedLog((prev) => (prev?.id === log.id ? null : log))}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon name={m?.icon || "info"} size={14} color={m?.color || "#62748E"} />
                              <span className="font-medium text-neutral-800">{m?.label || log.action}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{log.userName}</td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell max-w-[180px]">
                            <span className="line-clamp-1">{log.detail || "—"}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-400 hidden lg:table-cell">{log.ipAddress}</td>
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
                  <p>{filtered.length} log · Trang {page + 1}/{totalPages}</p>
                  <div className="flex gap-1">
                    <button type="button" disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50 transition-colors">
                      ← Trước
                    </button>
                    <button type="button" disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50 transition-colors">
                      Tiếp →
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
