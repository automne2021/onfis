import { useState, useEffect, useRef } from "react";
import type { CreateExecutiveRequest, ExecutiveRequest, AssigneeUser } from "../services/delegationService";
import { delegationService } from "../services/delegationService";

interface DelegationFormProps {
  onSubmit: (data: CreateExecutiveRequest) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const PRIORITIES: { value: ExecutiveRequest["priority"]; label: string; color: string }[] = [
  { value: "URGENT", label: "Khẩn cấp", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "HIGH", label: "Cao", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "MEDIUM", label: "Trung bình", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "LOW", label: "Thấp", color: "bg-neutral-100 text-neutral-600 border-neutral-200" },
];

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return f + l || "?";
}

function getFullName(user: AssigneeUser): string {
  const parts = [user.lastName, user.firstName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
}

function getRoleBadge(role: string): { label: string; color: string } {
  switch (role) {
    case "ADMIN":
      return { label: "Admin", color: "bg-purple-100 text-purple-700" };
    case "MANAGER":
      return { label: "Manager", color: "bg-blue-100 text-blue-700" };
    default:
      return { label: role, color: "bg-neutral-100 text-neutral-600" };
  }
}

export default function DelegationForm({ onSubmit, isSubmitting, onCancel }: DelegationFormProps) {
  const [form, setForm] = useState<CreateExecutiveRequest>({
    title: "",
    description: "",
    priority: "HIGH",
    assigneeIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // People picker state
  const [availableUsers, setAvailableUsers] = useState<AssigneeUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load assignable users on mount
  useEffect(() => {
    (async () => {
      setIsLoadingUsers(true);
      try {
        const users = await delegationService.listAssignableUsers();
        setAvailableUsers(users);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedUsers = availableUsers.filter((u) => form.assigneeIds.includes(u.id));
  const filteredUsers = availableUsers.filter((u) => {
    if (form.assigneeIds.includes(u.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = getFullName(u).toLowerCase();
    return fullName.includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const toggleUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId],
    }));
    setErrors((prev) => ({ ...prev, assignees: "" }));
    setSearchQuery("");
  };

  const removeUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.filter((id) => id !== userId),
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Tiêu đề không được để trống";
    if (!form.description.trim()) errs.description = "Mô tả không được để trống";
    if (form.assigneeIds.length === 0) errs.assignees = "Vui lòng chọn ít nhất một người được giao";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white rounded-2xl border border-neutral-200/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Tạo ủy quyền mới</h3>
        <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Tiêu đề *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: "" }); }}
          placeholder="VD: Phê duyệt ngân sách Q3 cho Marketing"
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all
            ${errors.title ? "border-red-300" : "border-neutral-200 focus:border-indigo-400"}`}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Mô tả chi tiết *</label>
        <textarea
          value={form.description}
          onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: "" }); }}
          placeholder="Mô tả rõ nội dung, yêu cầu và thời hạn..."
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none
            ${errors.description ? "border-red-300" : "border-neutral-200 focus:border-indigo-400"}`}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">Mức độ ưu tiên</label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm({ ...form, priority: p.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                ${form.priority === p.value ? `${p.color} ring-2 ring-offset-1` : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignee multi-select with search */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">
          Giao cho <span className="text-neutral-400 font-normal">(Admin / Manager)</span> *
        </label>

        {/* Selected users chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {selectedUsers.map((user) => {
              const badge = getRoleBadge(user.role);
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-sm transition-all animate-[fadeIn_0.2s_ease-out]"
                >
                  {/* Avatar */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <span className="text-indigo-800 font-medium text-xs">{getFullName(user)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeUser(user.id)}
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Search input & dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all
            ${errors.assignees ? "border-red-300" : isDropdownOpen ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-neutral-200"}
            bg-white`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400 flex-shrink-0">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={selectedUsers.length > 0 ? "Thêm người khác..." : "Tìm kiếm theo tên, email hoặc vai trò..."}
              className="flex-1 outline-none bg-transparent text-sm placeholder:text-neutral-400"
            />
            {isLoadingUsers && (
              <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            )}
          </div>

          {/* Dropdown */}
          {isDropdownOpen && !isLoadingUsers && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-neutral-200 shadow-lg shadow-neutral-200/50 max-h-60 overflow-y-auto animate-[slideDown_0.15s_ease-out]">
              {filteredUsers.length === 0 ? (
                <div className="py-6 text-center">
                  <span className="text-2xl">🔍</span>
                  <p className="text-xs text-neutral-400 mt-2">
                    {searchQuery ? "Không tìm thấy kết quả" : "Đã chọn tất cả"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/60 transition-all text-left border-b border-neutral-100 last:border-0"
                    >
                      {/* Avatar */}
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 truncate">
                            {getFullName(user)}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                      </div>
                      {/* Add icon */}
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-400">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        {errors.assignees && <p className="text-xs text-red-500">{errors.assignees}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm text-neutral-500 hover:bg-neutral-100 transition-all">
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              Đang tạo...
            </>
          ) : (
            "Tạo ủy quyền"
          )}
        </button>
      </div>
    </form>
  );
}
