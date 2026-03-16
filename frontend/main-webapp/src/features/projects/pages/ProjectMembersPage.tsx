import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { useRole } from "../../../hooks/useRole";
import type { ProjectMember, ProjectRole } from "../types";

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_MEMBERS: ProjectMember[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    projectRole: "Lead",
    joinedAt: "Jan 1, 2026",
    taskCount: 5,
  },
  {
    id: "2",
    name: "John Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    projectRole: "Developer",
    joinedAt: "Jan 5, 2026",
    taskCount: 3,
  },
  {
    id: "3",
    name: "Alice Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    projectRole: "Designer",
    joinedAt: "Jan 10, 2026",
    taskCount: 4,
  },
  {
    id: "4",
    name: "Bob Wilson",
    projectRole: "QA",
    joinedAt: "Jan 15, 2026",
    taskCount: 2,
  },
  {
    id: "5",
    name: "Carol Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    projectRole: "Analyst",
    joinedAt: "Feb 1, 2026",
    taskCount: 1,
  },
  {
    id: "6",
    name: "David Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    projectRole: "Developer",
    joinedAt: "Feb 10, 2026",
    taskCount: 3,
  },
];

const MOCK_AVAILABLE_USERS = [
  { id: "7", name: "Emma Watson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" },
  { id: "8", name: "Frank Miller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank" },
  { id: "9", name: "Grace Lee", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace" },
];

const ALL_PROJECT_ROLES: ProjectRole[] = ["Lead", "Developer", "Designer", "QA", "Analyst"];

// ── Role badge config ──────────────────────────────────────────────────────────
const ROLE_BADGE: Record<ProjectRole, string> = {
  Lead: "bg-primary/10 text-primary border-primary/20",
  Developer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Designer: "bg-purple-50 text-purple-700 border-purple-200",
  QA: "bg-amber-50 text-amber-700 border-amber-200",
  Analyst: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

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

// ── Add Member Modal ───────────────────────────────────────────────────────────
interface AddMemberModalProps {
  existingIds: string[];
  onAdd: (userId: string, role: ProjectRole) => void;
  onClose: () => void;
}

function AddMemberModal({ existingIds, onAdd, onClose }: AddMemberModalProps) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("Developer");

  const filteredUsers = MOCK_AVAILABLE_USERS.filter(
    (u) =>
      !existingIds.includes(u.id) &&
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-sm p-6 flex flex-col gap-5 animate-slideUp">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Add Member</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

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
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">No users found</p>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  selectedUserId === user.id
                    ? "bg-primary/8 ring-1 ring-primary/30"
                    : "hover:bg-neutral-50"
                }`}
              >
                <Avatar name={user.name} avatar={user.avatar} size={32} />
                <span className="text-sm font-medium text-neutral-900">{user.name}</span>
                {selectedUserId === user.id && (
                  <span className="material-symbols-rounded text-primary ml-auto" style={{ fontSize: 18 }}>check_circle</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Role selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Project Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 outline-none focus:border-primary transition-colors"
          >
            {ALL_PROJECT_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
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
            onClick={() => selectedUserId && onAdd(selectedUserId, selectedRole)}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────────
interface MemberCardProps {
  member: ProjectMember;
  isManager: boolean;
  onRoleChange: (id: string, role: ProjectRole) => void;
  onRemove: (id: string) => void;
}

function MemberCard({ member, isManager, onRoleChange, onRemove }: MemberCardProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

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

      {/* Role badge */}
      <div className="flex justify-center">
        {isManager ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors hover:opacity-80 ${ROLE_BADGE[member.projectRole]}`}
            >
              {member.projectRole}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showRoleMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-20 w-32">
                {ALL_PROJECT_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      onRoleChange(member.id, role);
                      setShowRoleMenu(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      role === member.projectRole
                        ? "font-semibold text-primary bg-primary/5"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {role === member.projectRole && (
                      <span className="material-symbols-rounded text-primary" style={{ fontSize: 12 }}>check</span>
                    )}
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGE[member.projectRole]}`}>
            {member.projectRole}
          </span>
        )}
      </div>

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
  const { isManager } = useRole();
  const [members, setMembers] = useState<ProjectMember[]>(MOCK_MEMBERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleRoleChange = (id: string, role: ProjectRole) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, projectRole: role } : m)));
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAdd = (userId: string, role: ProjectRole) => {
    const user = MOCK_AVAILABLE_USERS.find((u) => u.id === userId);
    if (!user) return;
    const newMember: ProjectMember = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      projectRole: role,
      joinedAt: "Mar 12, 2026",
      taskCount: 0,
    };
    setMembers((prev) => [...prev, newMember]);
    setIsAddModalOpen(false);
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

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isManager={isManager}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
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
          onAdd={handleAdd}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
