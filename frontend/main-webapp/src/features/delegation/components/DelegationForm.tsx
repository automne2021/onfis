import { useState, useEffect, useMemo, useRef } from "react";
import type { CreateExecutiveRequest, AssigneeUser } from "../services/delegationService";
import { delegationService } from "../services/delegationService";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Button } from "../../../components/common/Buttons/Button";

interface DelegationFormProps {
  onSubmit: (data: CreateExecutiveRequest) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return f + l || "?";
}

function getFullName(user: AssigneeUser): string {
  const parts = [user.lastName, user.firstName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getRolePriority(role: string): number {
  const normalized = role.trim().toUpperCase();
  if (normalized === "ADMIN") return 0;
  if (normalized === "MANAGER") return 1;
  return 2;
}


export default function DelegationForm({ onSubmit, isSubmitting, onCancel }: DelegationFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CreateExecutiveRequest>({
    title: "",
    description: "",
    priority: "HIGH",
    assigneeIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [availableUsers, setAvailableUsers] = useState<AssigneeUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sortedUsers = useMemo(() => {
    return [...availableUsers].sort((left, right) => {
      const byRole = getRolePriority(left.role) - getRolePriority(right.role);
      if (byRole !== 0) return byRole;

      const leftName = getFullName(left);
      const rightName = getFullName(right);
      return leftName.localeCompare(rightName, "vi");
    });
  }, [availableUsers]);

  const selectedUsers = sortedUsers.filter((u) => form.assigneeIds.includes(u.id));
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const filteredUsers = sortedUsers.filter((u) => {
    if (form.assigneeIds.includes(u.id)) return false;
    if (!normalizedQuery) return true;

    const searchableValues = [
      getFullName(u),
      u.email,
      u.role,
      `${u.firstName ?? ""} ${u.lastName ?? ""}`,
    ]
      .map((value) => normalizeSearchValue(value))
      .filter(Boolean);

    return searchableValues.some((value) => value.includes(normalizedQuery));
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
    setIsDropdownOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.filter((id) => id !== userId),
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = t("Title cannot be empty");
    if (!form.description.trim()) errs.description = t("Description cannot be empty");
    if (form.assigneeIds.length === 0) errs.assignees = t("Please select at least one assignee");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const PRIORITY_OPTIONS = [
    { value: "URGENT", label: t("Urgent"), color: "bg-red-100 text-red-700 border-red-200" },
    { value: "HIGH", label: t("High"), color: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: "MEDIUM", label: t("Medium"), color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "LOW", label: t("Low"), color: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white rounded-2xl border border-neutral-200/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">{t("Create new delegation")}</h3>
        <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">{t("Title *")}</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: "" }); }}
          placeholder={t("Ex: Q3 Marketing budget approval")}
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all
            ${errors.title ? "border-red-300" : "border-neutral-200 focus:border-indigo-400"}`}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">{t("Description *")}</label>
        <textarea
          value={form.description}
          onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: "" }); }}
          placeholder={t("Describe the content, requirements, and deadline...")}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none
            ${errors.description ? "border-red-300" : "border-neutral-200 focus:border-indigo-400"}`}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">{t("Priority")}</label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm({ ...form, priority: p.value as any })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                ${form.priority === p.value ? `${p.color} ring-2 ring-offset-1` : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">
          {t("Assign to")} <span className="text-neutral-400 font-normal">(Admin / Manager)</span> *
        </label>

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {selectedUsers.map((user) => {
              return (
                <div key={user.id} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-sm transition-all">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <span className="text-indigo-800 font-medium text-xs">{getFullName(user)}</span>
                  <button type="button" onClick={() => removeUser(user.id)} className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-indigo-400 hover:text-red-500 hover:bg-red-50">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all
            ${errors.assignees ? "border-red-300" : isDropdownOpen ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-neutral-200"}
            bg-white`}
            onClick={() => {
              setIsDropdownOpen(true);
              inputRef.current?.focus();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={selectedUsers.length > 0 ? t("Add others...") : t("Search by name, email, or role...")}
              className="flex-1 outline-none bg-transparent text-sm placeholder:text-neutral-400"
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-neutral-200 shadow-lg max-h-60 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  {t("Loading members...")}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  {searchQuery ? t("No results found") : t("All selected")}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button key={user.id} type="button" onClick={() => toggleUser(user.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-left border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{getInitials(user.firstName, user.lastName)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{getFullName(user)}</p>
                      <p className="text-[11px] text-neutral-400">{user.email}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{user.role}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {errors.assignees && <p className="text-xs text-red-500">{errors.assignees}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          style="sub"
          title={t("Cancel")}
          onClick={onCancel}
        />
        <Button
          type="submit"
          style="primary"
          title={isSubmitting ? t("Creating...") : t("Create Delegation")}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
