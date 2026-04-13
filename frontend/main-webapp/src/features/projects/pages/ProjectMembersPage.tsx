import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useTenantPath } from "../../../hooks/useTenantPath";
import type { ProjectCustomRole, ProjectMember } from "../types";
import {
  addProjectMember,
  assignMemberCustomRole,
  createProjectCustomRole,
  deleteProjectCustomRole,
  getCurrentProjectUser,
  getProjectCustomRoles,
  getProjectMembers,
  removeProjectMember,
  removeMemberCustomRole,
  searchProjectUsers,
  updateProjectCustomRole,
} from "../../../services/projectService";
import { useToast } from "../../../contexts/useToast";

// ── Avatar util ────────────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = 48 }: { name: string; avatar?: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center font-semibold text-neutral-600 flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ── Preset colors for custom roles ────────────────────────────────────────────
const PRESET_COLORS = [
  "#64748B", "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316",
];

// ── Project Roles Manager (manager-only panel) ────────────────────────────────
interface ProjectRolesManagerProps {
  projectId: string;
  roles: ProjectCustomRole[];
  onCreated: (role: ProjectCustomRole) => void;
  onUpdated: (role: ProjectCustomRole) => void;
  onDeleted: (roleId: string) => void;
}

function ProjectRolesManager({ projectId, roles, onCreated, onUpdated, onDeleted }: ProjectRolesManagerProps) {
  const { showToast } = useToast();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const role = await createProjectCustomRole(projectId, { name, color: newColor });
      onCreated(role);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      showToast("Custom role created", "success");
    } catch {
      showToast("Failed to create role", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (role: ProjectCustomRole) => {
    setEditingId(role.id);
    setEditName(role.name);
    setEditColor(role.color);
  };

  const handleUpdate = async (roleId: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      const updated = await updateProjectCustomRole(projectId, roleId, { name, color: editColor });
      onUpdated(updated);
      setEditingId(null);
      showToast("Role updated", "success");
    } catch {
      showToast("Failed to update role", "error");
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      await deleteProjectCustomRole(projectId, roleId);
      onDeleted(roleId);
      setDeletingId(null);
      showToast("Role deleted", "success");
    } catch {
      showToast("Failed to delete role", "error");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
        <span className="material-symbols-rounded text-primary" style={{ fontSize: 18 }}>label</span>
        Project Roles
      </h3>

      {/* Existing roles */}
      {roles.length > 0 && (
        <div className="flex flex-col gap-2">
          {roles.map((role) =>
            editingId === role.id ? (
              <div key={role.id} className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: editColor === c ? "#1a1a1a" : "transparent" }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleUpdate(role.id); if (e.key === "Escape") setEditingId(null); }}
                  className="flex-1 text-xs px-2 py-1.5 border border-primary rounded-lg outline-none"
                  autoFocus
                />
                <button type="button" onClick={() => void handleUpdate(role.id)} className="text-xs px-2.5 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">Save</button>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs px-2.5 py-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
              </div>
            ) : (
              <div key={role.id} className="flex items-center gap-2 group/role">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: role.color }}
                >
                  {role.name}
                </span>
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/role:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEdit(role)}
                    className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span>
                  </button>
                  {deletingId === role.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => void handleDelete(role.id)} className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Delete</button>
                      <button type="button" onClick={() => setDeletingId(null)} className="px-2 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(role.id)}
                      className="p-1 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Create new role */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
        <p className="text-xs font-medium text-neutral-500">New role</p>
        <div className="flex gap-1 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: newColor === c ? "#1a1a1a" : "transparent" }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Role name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            maxLength={80}
            className="flex-1 text-xs px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            disabled={!newName.trim() || saving}
            onClick={() => void handleCreate()}
            className="px-3 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Member Modal ───────────────────────────────────────────────────────────
interface AddMemberModalProps {
  existingIds: string[];
  customRoles: ProjectCustomRole[];
  onAdd: (userId: string, selectedRoleIds: string[]) => void;
  onClose: () => void;
}

function AddMemberModal({ existingIds, customRoles, onAdd, onClose }: AddMemberModalProps) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setSearching(true);
        const results = await searchProjectUsers(search);
        setAvailableUsers(results.filter((u) => !existingIds.includes(u.id)));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    };
    const timer = setTimeout(() => { void fetchUsers(); }, 300);
    return () => clearTimeout(timer);
  }, [search, existingIds]);

  const toggleRole = (id: string) =>
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-xl shadow-xl overflow-hidden border border-neutral-200 z-10 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[52px] border-b border-neutral-200">
          <h2 className="text-base font-bold text-neutral-900">Add Member</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg focus-within:border-primary transition-colors">
            <span className="material-symbols-rounded text-neutral-400" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-neutral-900 placeholder:text-neutral-400"
              autoFocus
            />
          </div>

          {/* User list */}
          <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto custom-scrollbar">
            {searching && <p className="text-sm text-neutral-400 text-center py-4">Searching...</p>}
            {!searching && availableUsers.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-4">No users found</p>
            )}
            {availableUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  selectedUserId === user.id ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-neutral-50"
                }`}
              >
                <Avatar name={user.name} avatar={user.avatar} size={32} />
                <span className="text-sm font-medium text-neutral-900">{user.name}</span>
                {selectedUserId === user.id && (
                  <span className="material-symbols-rounded text-primary ml-auto" style={{ fontSize: 18 }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          {/* Custom role chips */}
          {customRoles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-700">Assign roles <span className="text-neutral-400 font-normal">(optional)</span></p>
              <div className="flex flex-wrap gap-1.5">
                {customRoles.map((r) => {
                  const selected = selectedRoleIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                        selected ? "text-white" : "bg-white"
                      }`}
                      style={{
                        background: selected ? r.color : "white",
                        borderColor: r.color,
                        color: selected ? "white" : r.color,
                      }}
                    >
                      {selected && <span className="material-symbols-rounded" style={{ fontSize: 12 }}>check</span>}
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedUserId}
            onClick={() => selectedUserId && onAdd(selectedUserId, selectedRoleIds)}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Member
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Member Card ────────────────────────────────────────────────────────────────
interface MemberCardProps {
  member: ProjectMember;
  isManager: boolean;
  availableCustomRoles: ProjectCustomRole[];
  onRemove: (id: string) => void;
  onAssignCustomRole: (memberId: string, roleId: string) => void;
  onRemoveCustomRole: (memberId: string, roleId: string) => void;
}

function MemberCard({ member, isManager, availableCustomRoles, onRemove, onAssignCustomRole, onRemoveCustomRole }: MemberCardProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showCustomRoleMenu, setShowCustomRoleMenu] = useState(false);
  const customRoleMenuRef = useRef<HTMLDivElement>(null);

  // Close custom role dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customRoleMenuRef.current && !customRoleMenuRef.current.contains(e.target as Node)) {
        setShowCustomRoleMenu(false);
      }
    };
    if (showCustomRoleMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustomRoleMenu]);

  const assignedIds = new Set(member.customRoles.map((r) => r.id));
  const unassigned = availableCustomRoles.filter((r) => !assignedIds.has(r.id));

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex flex-col gap-4 relative group">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar name={member.name} avatar={member.avatar} size={56} />
        <div>
          <p className="font-semibold text-sm text-neutral-900 leading-tight">{member.name}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Joined {member.joinedAt}</p>
        </div>
      </div>

      {/* Custom role badges + assignment */}
      {(member.customRoles.length > 0 || (isManager && availableCustomRoles.length > 0)) && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {member.customRoles.map((cr) => (
            <span
              key={cr.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ background: cr.color }}
            >
              {cr.name}
              {isManager && (
                <button
                  type="button"
                  onClick={() => onRemoveCustomRole(member.id, cr.id)}
                  className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity leading-none"
                  title="Remove role"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 12 }}>close</span>
                </button>
              )}
            </span>
          ))}
          {isManager && unassigned.length > 0 && (
            <div ref={customRoleMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowCustomRoleMenu((v) => !v)}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-dashed border-neutral-300 text-neutral-400 hover:border-primary hover:text-primary transition-colors"
                title="Assign role"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 12 }}>add</span>
              </button>
              {showCustomRoleMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-30 min-w-[120px]">
                  {unassigned.map((cr) => (
                    <button
                      key={cr.id}
                      type="button"
                      onClick={() => {
                        onAssignCustomRole(member.id, cr.id);
                        setShowCustomRoleMenu(false);
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cr.color }} />
                      {cr.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task count */}
      <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-500">
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>task_alt</span>
        <span>{member.taskCount} task{member.taskCount !== 1 ? "s" : ""} assigned</span>
      </div>

      {/* Manager-only: remove button */}
      {isManager && (
        <div>
          {!confirmRemove ? (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span>
              Remove
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="flex-1 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onRemove(member.id)}
                className="flex-1 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────
export default function ProjectMembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { withTenant } = useTenantPath();
  const { showToast } = useToast();
  const [isManager, setIsManager] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [customRoles, setCustomRoles] = useState<ProjectCustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const [me, apiMembers, apiCustomRoles] = await Promise.all([
          getCurrentProjectUser(),
          getProjectMembers(projectId),
          getProjectCustomRoles(projectId),
        ]);
        setIsManager(me.permissions.includes("PROJECT_MANAGE"));
        setCustomRoles(apiCustomRoles);
        setMembers(apiMembers.map((m) => ({
          ...m,
          joinedAt: new Date(m.joinedAt).toLocaleDateString(),
          customRoles: m.customRoles ?? [],
        })));
      } catch {
        showToast("Failed to load project members", "error");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [projectId, showToast]);

  const handleRemove = async (id: string) => {
    if (!projectId) return;
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      await removeProjectMember(projectId, id);
      showToast("Member removed", "success");
    } catch {
      setMembers(previous);
      showToast("Unable to remove member", "error");
    }
  };

  const handleAdd = async (userId: string, selectedRoleIds: string[]) => {
    if (!projectId) return;
    try {
      const added = await addProjectMember(projectId, { userId, role: "MEMBER" });
      // Assign any pre-selected custom roles
      if (selectedRoleIds.length > 0) {
        await Promise.allSettled(
          selectedRoleIds.map((roleId) => assignMemberCustomRole(projectId, added.id, roleId))
        );
      }
      const assignedRoles = customRoles.filter((r) => selectedRoleIds.includes(r.id));
      setMembers((prev) => [
        ...prev,
        {
          ...added,
          joinedAt: new Date(added.joinedAt).toLocaleDateString(),
          customRoles: assignedRoles,
        },
      ]);
      setIsAddModalOpen(false);
      showToast("Member added", "success");
    } catch {
      showToast("Unable to add member", "error");
    }
  };

  const handleAssignCustomRole = async (memberId: string, roleId: string) => {
    if (!projectId) return;
    const role = customRoles.find((r) => r.id === roleId);
    if (!role) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId && !m.customRoles.some((cr) => cr.id === roleId)
          ? { ...m, customRoles: [...m.customRoles, role] }
          : m
      )
    );
    try {
      await assignMemberCustomRole(projectId, memberId, roleId);
    } catch {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, customRoles: m.customRoles.filter((cr) => cr.id !== roleId) } : m
        )
      );
      showToast("Failed to assign role", "error");
    }
  };

  const handleRemoveCustomRole = async (memberId: string, roleId: string) => {
    if (!projectId) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, customRoles: m.customRoles.filter((cr) => cr.id !== roleId) } : m
      )
    );
    try {
      await removeMemberCustomRole(projectId, memberId, roleId);
    } catch {
      const role = customRoles.find((r) => r.id === roleId);
      if (role) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId ? { ...m, customRoles: [...m.customRoles, role] } : m
          )
        );
      }
      showToast("Failed to remove role", "error");
    }
  };

  return (
    <div className="onfis-section">
      {/* Breadcrumb */}
      <nav className="navbar-style">
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <Link to={withTenant("/projects")} className="hover:text-primary transition-colors">Projects</Link>
          <span>/</span>
          <Link to={withTenant(`/projects/${projectId ?? ""}`)} className="hover:text-primary transition-colors">Overview</Link>
          <span>/</span>
          <span className="text-primary font-medium">Team</span>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_add</span>
            Add Member
          </button>
        )}
      </nav>

      {/* Header */}
      <div className="mt-3 mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">Team</h1>
        <span className="inline-flex items-center justify-center w-7 h-7 text-sm font-bold text-primary bg-primary/10 rounded-full">
          {members.length}
        </span>
      </div>

      {loading && <div className="text-sm text-neutral-500 mb-3">Loading members...</div>}

      {/* Manager: project roles manager panel */}
      {isManager && projectId && (
        <div className="mb-6 max-w-sm">
          <ProjectRolesManager
            projectId={projectId}
            roles={customRoles}
            onCreated={(role) => setCustomRoles((prev) => [...prev, role])}
            onUpdated={(role) => setCustomRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)))}
            onDeleted={(roleId) => {
              setCustomRoles((prev) => prev.filter((r) => r.id !== roleId));
              setMembers((prev) =>
                prev.map((m) => ({ ...m, customRoles: m.customRoles.filter((cr) => cr.id !== roleId) }))
              );
            }}
          />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isManager={isManager}
            availableCustomRoles={customRoles}
            onRemove={handleRemove}
            onAssignCustomRole={handleAssignCustomRole}
            onRemoveCustomRole={handleRemoveCustomRole}
          />
        ))}

        {/* Add member placeholder card (manager only) */}
        {isManager && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-primary hover:text-primary hover:bg-primary/3 transition-colors min-h-[180px] cursor-pointer"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 28 }}>person_add</span>
            <span className="text-xs font-medium">Add Member</span>
          </button>
        )}
      </div>

      {/* Add member modal */}
      {isAddModalOpen && (
        <AddMemberModal
          existingIds={members.map((m) => m.id)}
          customRoles={customRoles}
          onAdd={handleAdd}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
