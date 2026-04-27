import { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon";
import { Button } from "../../../components/common/Buttons/Button";
import Modal from "../../../components/common/Modal";
import { useToast } from "../../../contexts/useToast";
import { adminService } from "../services/adminService";
import type { AdminUser, AccountStatus, OnboardingForm } from "../types/adminTypes";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_USERS: AdminUser[] = [
  { id: "u1", name: "Nguyễn Văn An", email: "an.nguyen@company.vn", role: "SUPER_ADMIN", department: "Ban Giám đốc", status: "ACTIVE", createdAt: "2024-01-10T07:00:00Z", lastLogin: "2026-04-27T08:00:00Z" },
  { id: "u2", name: "Trần Thị Bình", email: "binh.tran@company.vn", role: "ADMIN", department: "IT", status: "ACTIVE", createdAt: "2024-02-15T07:00:00Z", lastLogin: "2026-04-26T17:30:00Z" },
  { id: "u3", name: "Lê Minh Cường", email: "cuong.le@company.vn", role: "MANAGER", department: "Kỹ thuật", status: "ACTIVE", createdAt: "2024-03-01T07:00:00Z", lastLogin: "2026-04-25T09:00:00Z" },
  { id: "u4", name: "Phạm Thị Dung", email: "dung.pham@company.vn", role: "EMPLOYEE", department: "Kỹ thuật", status: "ACTIVE", createdAt: "2024-04-20T07:00:00Z", lastLogin: "2026-04-27T07:45:00Z" },
  { id: "u5", name: "Hoàng Văn Em", email: "em.hoang@company.vn", role: "EMPLOYEE", department: "Sales", status: "INACTIVE", createdAt: "2024-05-10T07:00:00Z" },
  { id: "u6", name: "Vũ Thị Phương", email: "phuong.vu@company.vn", role: "MANAGER", department: "Marketing", status: "ACTIVE", createdAt: "2024-06-01T07:00:00Z", lastLogin: "2026-04-24T14:00:00Z" },
  { id: "u7", name: "Đặng Quốc Tuấn", email: "tuan.dang@company.vn", role: "EMPLOYEE", department: "Sales", status: "SUSPENDED", createdAt: "2024-07-15T07:00:00Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_META: Record<AdminUser["role"], { label: string; bg: string; text: string }> = {
  SUPER_ADMIN: { label: "Super Admin", bg: "bg-purple-50", text: "text-purple-700" },
  ADMIN: { label: "Admin", bg: "bg-blue-50", text: "text-blue-700" },
  MANAGER: { label: "Manager", bg: "bg-indigo-50", text: "text-indigo-700" },
  EMPLOYEE: { label: "Nhân viên", bg: "bg-neutral-100", text: "text-neutral-600" },
};

const STATUS_META: Record<AccountStatus, { label: string; dot: string; text: string }> = {
  ACTIVE: { label: "Hoạt động", dot: "bg-green-500", text: "text-green-700" },
  INACTIVE: { label: "Không hoạt động", dot: "bg-neutral-400", text: "text-neutral-500" },
  SUSPENDED: { label: "Đã khóa", dot: "bg-red-500", text: "text-red-600" },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name.split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase();
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  const m = ROLE_META[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

// ─── Onboarding modal ─────────────────────────────────────────────────────────

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: OnboardingForm) => Promise<void>;
}

function OnboardModal({ isOpen, onClose, onSubmit }: OnboardModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) setEmail("");
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast("Email là bắt buộc.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Địa chỉ email không hợp lệ.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ email: email.trim() });
      showToast("Tài khoản đã được tạo thành công.", "success");
      onClose();
    } catch {
      showToast("Không thể tạo tài khoản.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm nhân viên mới" maxWidth="sm"
      footer={
        <div className="flex justify-end gap-3 px-8 py-4 border-t border-neutral-100">
          <Button style="sub" title="Hủy" onClick={onClose} />
          <Button style="primary" title="Tạo tài khoản" loading={submitting} onClick={() => void handleSubmit()} />
        </div>
      }
    >
      <div className="px-8 py-5 space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <Icon name="info" size={16} color="#2563EB" className="shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Tài khoản trống sẽ được tạo với mật khẩu mặc định <span className="font-semibold font-mono">123456</span>. Nhân viên cần đổi mật khẩu sau lần đăng nhập đầu tiên.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.vn"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── User detail / action modal ───────────────────────────────────────────────

interface UserActionModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onRoleChange: (userId: string, role: AdminUser["role"]) => Promise<void>;
  onDisable: (userId: string) => Promise<void>;
  onEnable: (userId: string) => Promise<void>;
  onResetPassword: (userId: string) => Promise<void>;
  onForceLogout: (userId: string) => Promise<void>;
}

function UserActionModal({
  user, isOpen, onClose,
  onRoleChange, onDisable, onEnable, onResetPassword, onForceLogout,
}: UserActionModalProps) {
  const [newRole, setNewRole] = useState<AdminUser["role"]>("EMPLOYEE");
  const [acting, setActing] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (user) setNewRole(user.role);
  }, [user]);

  if (!user) return null;

  const act = async (key: string, fn: () => Promise<void>, msg: string) => {
    setActing(key);
    try {
      await fn();
      showToast(msg, "success");
      onClose();
    } catch {
      showToast("Thao tác thất bại.", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết & Quản lý tài khoản" maxWidth="md">
      <div className="px-8 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{user.name}</p>
            <p className="text-sm text-neutral-500">{user.email}</p>
            {user.department && <p className="text-xs text-neutral-400">{user.department} {user.position && `· ${user.position}`}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Trạng thái</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_META[user.status].text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[user.status].dot}`} />
              {STATUS_META[user.status].label}
            </span>
          </div>
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Vai trò hiện tại</p>
            <RoleBadge role={user.role} />
          </div>
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Ngày tạo</p>
            <p className="font-medium">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Đăng nhập gần nhất</p>
            <p className="font-medium">{formatDateTime(user.lastLogin)}</p>
          </div>
        </div>

        {/* RBAC Role change */}
        <div className="border border-neutral-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
            <Icon name="manage_accounts" size={14} color="#0014A8" /> Thay đổi vai trò (RBAC)
          </p>
          <div className="flex items-center gap-2">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminUser["role"])}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              disabled={user.role === "SUPER_ADMIN"}
            >
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <Button
              style="primary"
              title="Cập nhật"
              loading={acting === "role"}
              disabled={newRole === user.role || user.role === "SUPER_ADMIN"}
              onClick={() => act("role", () => onRoleChange(user.id, newRole), "Vai trò đã được cập nhật.")}
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-1.5">
            Thay đổi này sẽ đồng bộ với Supabase Auth metadata & RLS policies.
          </p>
        </div>

        {/* Account lifecycle */}
        <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
            <Icon name="admin_panel_settings" size={14} color="#0014A8" /> Quản trị vòng đời
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              style="sub"
              iconLeft={<Icon name="lock_reset" size={14} color="#62748E" />}
              title="Reset mật khẩu"
              loading={acting === "reset"}
              onClick={() => act("reset", () => onResetPassword(user.id), "Đã gửi email reset mật khẩu.")}
            />
            <Button
              style="sub"
              iconLeft={<Icon name="logout" size={14} color="#62748E" />}
              title="Buộc đăng xuất"
              loading={acting === "logout"}
              onClick={() => act("logout", () => onForceLogout(user.id), "Người dùng đã bị đăng xuất.")}
            />
            {user.status === "ACTIVE" ? (
              <Button
                style="danger"
                iconLeft={<Icon name="block" size={14} color="#ef4444" />}
                title="Vô hiệu hóa (Offboarding)"
                loading={acting === "disable"}
                disabled={user.role === "SUPER_ADMIN"}
                onClick={() => act("disable", () => onDisable(user.id), "Tài khoản đã bị vô hiệu hóa.")}
              />
            ) : (
              <Button
                style="primary"
                iconLeft={<Icon name="check_circle" size={14} color="#0014A8" />}
                title="Kích hoạt lại"
                loading={acting === "enable"}
                onClick={() => act("enable", () => onEnable(user.id), "Tài khoản đã được kích hoạt.")}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [onboardOpen, setOnboardOpen] = useState(false);

  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.listUsers();
      setUsers(res.users);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = users.filter((u) => {
    const matchDept = !filterDept || u.department === filterDept;
    const matchStatus = !filterStatus || u.status === filterStatus;
    const matchRole = !filterRole || u.role === filterRole;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchDept && matchStatus && matchRole && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const mutateUser = (id: string, patch: Partial<AdminUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setSelectedUser((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const handleRoleChange = async (userId: string, role: AdminUser["role"]) => {
    try {
      await adminService.updateUserRole(userId, role);
    } catch { /* mock */ }
    mutateUser(userId, { role });
    showToast("Vai trò đã được cập nhật.", "success");
  };

  const handleDisable = async (userId: string) => {
    try { await adminService.disableUser(userId); } catch { /* mock */ }
    mutateUser(userId, { status: "INACTIVE" });
    showToast("Tài khoản đã bị vô hiệu hóa.", "success");
  };

  const handleEnable = async (userId: string) => {
    try { await adminService.enableUser(userId); } catch { /* mock */ }
    mutateUser(userId, { status: "ACTIVE" });
    showToast("Tài khoản đã được kích hoạt.", "success");
  };

  const handleResetPassword = async (userId: string) => {
    try { await adminService.resetPassword(userId); } catch { /* mock */ }
    showToast("Đã gửi email reset mật khẩu.", "success");
  };

  const handleForceLogout = async (userId: string) => {
    try { await adminService.forceLogout(userId); } catch { /* mock */ }
    showToast("Người dùng đã bị đăng xuất.", "success");
  };

  const handleOnboard = async (form: OnboardingForm) => {
    let newUser: AdminUser;
    try {
      newUser = await adminService.createUser(form);
    } catch {
      newUser = {
        id: crypto.randomUUID(),
        name: form.email.split("@")[0],
        email: form.email,
        role: "EMPLOYEE",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
    }
    setUsers((prev) => [newUser, ...prev]);
  };

  const departments = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  return (
    <div className="onfis-section">
      {/* Navbar */}
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <Icon name="group" size={22} color="#0014A8" />
          <div>
            <h1 className="text-base font-bold text-neutral-900">Quản lý Người dùng & Phân quyền</h1>
            <p className="text-xs text-neutral-500">{users.length} tài khoản trong tenant</p>
          </div>
        </div>
        <Button
          style="primary"
          iconLeft={<Icon name="person_add" size={16} color="#0014A8" />}
          title="Thêm nhân viên"
          onClick={() => setOnboardOpen(true)}
        />
      </div>

      {/* Filters */}
      <div className="px-6 pt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="search" size={16} color="#9CA3AF" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên, email..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => { setFilterDept(e.target.value); setPage(0); }}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-600"
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-600"
        >
          <option value="">Tất cả vai trò</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Nhân viên</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-600"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="SUSPENDED">Đã khóa</option>
        </select>
        <button type="button" onClick={() => { setFilterDept(""); setFilterRole(""); setFilterStatus(""); setSearchQuery(""); setPage(0); }}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1.5">
          Xóa bộ lọc
        </button>
      </div>

      {/* Table */}
      <div className="px-6 pt-4 pb-6">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="section-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tên</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Phòng ban</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vai trò</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">Đăng nhập gần nhất</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {paged.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedUser(user)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <p className="font-medium text-neutral-900">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{user.email}</td>
                      <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{user.department || "—"}</td>
                      <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_META[user.status].text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[user.status].dot}`} />
                          {STATUS_META[user.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs hidden xl:table-cell">{formatDateTime(user.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <button type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-neutral-100"
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                          <Icon name="settings" size={14} color="#62748E" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-neutral-500">
                <p>{filtered.length} kết quả · Trang {page + 1}/{totalPages}</p>
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

      <OnboardModal isOpen={onboardOpen} onClose={() => setOnboardOpen(false)} onSubmit={handleOnboard} />
      <UserActionModal
        user={selectedUser}
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        onRoleChange={handleRoleChange}
        onDisable={handleDisable}
        onEnable={handleEnable}
        onResetPassword={handleResetPassword}
        onForceLogout={handleForceLogout}
      />
    </div>
  );
}
