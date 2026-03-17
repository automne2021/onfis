import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { useRole } from "../../../hooks/useRole";
import { useToast } from "../../../contexts/useToast";
import type { Task, ReviewComment } from "../types";
import { STATUS_CONFIG } from "../workflowUtils";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";

// ── Mock data ──────────────────────────────────────────────────────────────────
interface ReviewTask extends Task {
  projectName: string;
  submittedAt: string;
  reviews: ReviewComment[];
}

const MOCK_REVIEW_TASKS: ReviewTask[] = [
  {
    id: "rt-1",
    title: "Design system components",
    description: "Build shared component library and design tokens for the project",
    priority: "high",
    status: "IN_REVIEW",
    progress: 100,
    dueDate: "Mar 15, 2026",
    assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
    reporterId: "2",
    estimatedEffort: 8,
    actualEffort: 10,
    tags: [{ id: "t1", type: "scope", label: "Internal" }],
    projectName: "ABC Website",
    submittedAt: "Mar 11, 2026",
    reviews: [],
  },
  {
    id: "rt-2",
    title: "Backend API integration",
    description: "Connect frontend to REST APIs and handle edge cases",
    priority: "urgent",
    status: "IN_REVIEW",
    progress: 90,
    dueDate: "Apr 5, 2026",
    assignees: [{ id: "3", name: "Alice Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" }],
    reporterId: "2",
    estimatedEffort: 24,
    actualEffort: 22,
    tags: [{ id: "t2", type: "department", label: "Backend" }],
    projectName: "ABC Website",
    submittedAt: "Mar 10, 2026",
    reviews: [
      {
        id: "rc-1",
        authorId: "2",
        authorName: "John Doe",
        action: "comment",
        content: "Please add error handling for the 500 responses.",
        createdAt: "Mar 11, 2026",
      },
    ],
  },
  {
    id: "rt-3",
    title: "User authentication flow",
    description: "Implement OAuth 2.0 login with Google and GitHub SSO",
    priority: "medium",
    status: "DONE",
    progress: 100,
    dueDate: "Mar 8, 2026",
    assignees: [{ id: "4", name: "Bob Wilson" }],
    reporterId: "2",
    estimatedEffort: 12,
    actualEffort: 11,
    tags: [{ id: "t3", type: "scope", label: "External" }],
    projectName: "ABC Website",
    submittedAt: "Mar 7, 2026",
    reviews: [
      {
        id: "rc-2",
        authorId: "2",
        authorName: "John Doe",
        action: "approved",
        content: "Well implemented! The fallback flows are solid.",
        createdAt: "Mar 8, 2026",
      },
    ],
  },
  {
    id: "rt-4",
    title: "Database schema migration",
    description: "Migrate legacy tables to new normalized schema",
    priority: "high",
    status: "IN_PROGRESS",
    progress: 40,
    dueDate: "Apr 20, 2026",
    assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
    reporterId: "2",
    estimatedEffort: 20,
    actualEffort: 8,
    tags: [{ id: "t4", type: "department", label: "Backend" }],
    projectName: "ABC Website",
    submittedAt: "—",
    reviews: [
      {
        id: "rc-3",
        authorId: "2",
        authorName: "John Doe",
        action: "changes_requested",
        content: "The migration script needs a rollback strategy before re-submission.",
        createdAt: "Mar 5, 2026",
      },
    ],
  },
];

// ── Helper types ───────────────────────────────────────────────────────────────
type ManagerFilter = "all" | "pending" | "approved" | "changes";
type EmployeeFilter = "all" | "under_review" | "approved" | "rework";

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-neutral-400",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ── Shared utilities ───────────────────────────────────────────────────────────
function convertToTaskDetail(task: ReviewTask): TaskDetail {
  return {
    ...task,
    subTasks: [],
    activities: [
      { id: "a1", user: "System", action: "submitted for review", timestamp: "Recently" },
    ],
    comments: [],
    reviews: task.reviews,
    createdAt: "Mar 1, 2026",
    updatedAt: "Recently",
    key: `TASK-${task.id.toUpperCase()}`,
  };
}

function Avatar({ name, avatar, size = 28 }: { name: string; avatar?: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center text-[11px] font-bold text-neutral-600 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ── Manager Review Queue ───────────────────────────────────────────────────────
function ManagerReviewQueue({ projectId }: { projectId: string | undefined }) {
  const { withTenant } = useTenantPath();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ManagerFilter>("all");
  const [tasks, setTasks] = useState<ReviewTask[]>(MOCK_REVIEW_TASKS);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filterOptions: { key: ManagerFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending Review" },
    { key: "approved", label: "Approved" },
    { key: "changes", label: "Changes Requested" },
  ];

  const getFiltered = () =>
    tasks.filter((t) => {
      if (filter === "pending") return t.status === "IN_REVIEW";
      if (filter === "approved") return t.status === "DONE";
      if (filter === "changes") {
        const last = t.reviews[t.reviews.length - 1];
        return last?.action === "changes_requested";
      }
      return true;
    });

  const pendingCount = tasks.filter((t) => t.status === "IN_REVIEW").length;

  const handleApprove = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "DONE" as const,
              reviews: [
                ...t.reviews,
                {
                  id: `rc-${Date.now()}`,
                  authorId: "2",
                  authorName: "You",
                  action: "approved" as const,
                  content: "",
                  createdAt: "Just now",
                },
              ],
            }
          : t
      )
    );
    showToast("Task approved and marked as DONE.", "success");
  };

  const handleRequestChanges = (taskId: string, reason: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "IN_PROGRESS" as const,
              reviews: [
                ...t.reviews,
                {
                  id: `rc-${Date.now()}`,
                  authorId: "2",
                  authorName: "You",
                  action: "changes_requested" as const,
                  content: reason,
                  createdAt: "Just now",
                },
              ],
            }
          : t
      )
    );
    showToast("Changes requested — task returned to In Progress.", "warning");
  };

  const openDetail = (task: ReviewTask) => {
    setSelectedTask(convertToTaskDetail(task));
    setIsModalOpen(true);
  };

  const filtered = getFiltered();

  return (
    <div className="onfis-section">
      {/* Toolbar */}
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Review Queue</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Tasks submitted for your review
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-1 text-sm font-bold text-white bg-amber-500 rounded-full shadow-sm">
              {pendingCount} pending
            </span>
          )}
        </div>
        <Link
          to={withTenant(`/projects/${projectId ?? ""}`)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary transition-colors"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_back</span>
          Back to project
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mt-3 bg-neutral-100 p-1 rounded-xl w-fit">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === opt.key
                ? "bg-white text-primary shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="mt-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-xl border border-neutral-100">
            <span className="material-symbols-rounded text-neutral-300" style={{ fontSize: 48 }}>
              done_all
            </span>
            <p className="text-sm text-neutral-400">No tasks match this filter.</p>
          </div>
        ) : (
          filtered.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status];
            const lastReview = task.reviews[task.reviews.length - 1];
            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-col gap-3"
              >
                {/* Row 1: title + meta */}
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PRIORITY_COLOR[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => openDetail(task)}
                      className="text-left font-semibold text-sm text-neutral-900 hover:text-primary transition-colors"
                    >
                      {task.title}
                    </button>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      task.priority === "urgent"
                        ? "bg-red-50 text-red-600 border-red-200"
                        : task.priority === "high"
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200"
                    }`}>
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${statusCfg.color}`} />
                    <span className="text-xs font-medium text-neutral-600">{statusCfg.label}</span>
                  </div>
                </div>

                {/* Row 2: assignee + project + submitted */}
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    {task.assignees[0] && (
                      <Avatar name={task.assignees[0].name} avatar={task.assignees[0].avatar} size={20} />
                    )}
                    <span>{task.assignees[0]?.name ?? "Unassigned"}</span>
                  </div>
                  <span>·</span>
                  <span>{task.projectName}</span>
                  <span>·</span>
                  <span>Submitted {task.submittedAt}</span>
                  {lastReview && (
                    <>
                      <span>·</span>
                      <span className="italic truncate max-w-[200px]">
                        "{lastReview.content.slice(0, 60)}{lastReview.content.length > 60 ? "…" : ""}"
                      </span>
                    </>
                  )}
                </div>

                {/* Row 3: Quick actions (only for pending) */}
                {task.status === "IN_REVIEW" && (
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => handleApprove(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check</span>
                      Approve
                    </button>
                    <RequestChangesInline
                      onSubmit={(reason) => handleRequestChanges(task.id, reason)}
                    />
                    <button
                      type="button"
                      onClick={() => openDetail(task)}
                      className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View detail
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                    </button>
                  </div>
                )}
                {task.status !== "IN_REVIEW" && (
                  <div className="flex justify-end pt-1 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => openDetail(task)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View detail
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(updated) => console.log("Updated from queue:", updated)}
        />
      )}
    </div>
  );
}

// Inline "Request Changes" with expanding textarea
function RequestChangesInline({ onSubmit }: { onSubmit: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>undo</span>
        Request Changes
      </button>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="text"
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Brief reason..."
        className="flex-1 px-3 py-1.5 text-sm border border-amber-300 rounded-lg outline-none focus:border-amber-500 bg-amber-50"
        onKeyDown={(e) => {
          if (e.key === "Enter" && reason.trim()) {
            onSubmit(reason.trim());
            setReason("");
            setOpen(false);
          }
          if (e.key === "Escape") {
            setOpen(false);
            setReason("");
          }
        }}
      />
      <button
        type="button"
        disabled={!reason.trim()}
        onClick={() => {
          if (reason.trim()) {
            onSubmit(reason.trim());
            setReason("");
            setOpen(false);
          }
        }}
        className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-40"
      >
        Send
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setReason(""); }}
        className="px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

// ── Employee Submissions ───────────────────────────────────────────────────────
function EmployeeSubmissions({ projectId }: { projectId: string | undefined }) {
  const { withTenant } = useTenantPath();
  const [filter, setFilter] = useState<EmployeeFilter>("all");
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filterOptions: { key: EmployeeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "under_review", label: "Under Review" },
    { key: "approved", label: "Approved" },
    { key: "rework", label: "Rework Needed" },
  ];

  const getFiltered = () =>
    MOCK_REVIEW_TASKS.filter((t) => {
      const lastReview = t.reviews[t.reviews.length - 1];
      if (filter === "under_review") return t.status === "IN_REVIEW";
      if (filter === "approved") return t.status === "DONE";
      if (filter === "rework") return lastReview?.action === "changes_requested";
      return true;
    });

  const filtered = getFiltered();

  const STATUS_DISPLAY: Partial<Record<string, { label: string; bg: string; icon: string }>> = {
    IN_REVIEW: { label: "Under Review", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: "hourglass_top" },
    DONE: { label: "Approved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "verified" },
    IN_PROGRESS: { label: "Rework Needed", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: "undo" },
  };

  return (
    <div className="onfis-section">
      <div className="navbar-style">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Reviews</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Tasks you've submitted for review</p>
        </div>
        <Link
          to={withTenant(`/projects/${projectId ?? ""}`)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary transition-colors"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_back</span>
          Back to project
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mt-3 bg-neutral-100 p-1 rounded-xl w-fit">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === opt.key ? "bg-white text-primary shadow-sm" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-xl border border-neutral-100">
            <span className="material-symbols-rounded text-neutral-300" style={{ fontSize: 48 }}>rate_review</span>
            <p className="text-sm text-neutral-400">No submitted tasks match this filter.</p>
          </div>
        ) : (
          filtered.map((task) => {
            const lastReview = task.reviews[task.reviews.length - 1];
            const statusKey =
              task.status === "IN_REVIEW"
                ? "IN_REVIEW"
                : task.status === "DONE"
                ? "DONE"
                : lastReview?.action === "changes_requested"
                ? "IN_PROGRESS"
                : task.status;
            const display = STATUS_DISPLAY[statusKey];

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-neutral-300 transition-colors"
                onClick={() => {
                  setSelectedTask(convertToTaskDetail(task));
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PRIORITY_COLOR[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-900">{task.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{task.description}</p>
                  </div>
                  {display && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${display.bg}`}>
                      <span className="material-symbols-rounded" style={{ fontSize: 12 }}>{display.icon}</span>
                      {display.label}
                    </span>
                  )}
                </div>

                {/* Feedback snippet */}
                {lastReview && lastReview.content && (
                  <div className={`text-sm rounded-lg px-3 py-2 border ${
                    lastReview.action === "approved"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : lastReview.action === "changes_requested"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  }`}>
                    <span className="font-semibold">{lastReview.authorName}:</span>{" "}
                    {lastReview.content}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-neutral-400 border-t border-neutral-100 pt-2">
                  <span>{task.projectName}</span>
                  <span>·</span>
                  <span>Due {task.dueDate}</span>
                  {task.submittedAt !== "—" && (
                    <>
                      <span>·</span>
                      <span>Submitted {task.submittedAt}</span>
                    </>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[task.status].color}`} />
                    <span className="text-neutral-500 font-medium">{STATUS_CONFIG[task.status].label}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(updated) => console.log("Updated from employee reviews:", updated)}
        />
      )}
    </div>
  );
}

// ── Page entry ─────────────────────────────────────────────────────────────────
export default function ReviewQueuePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { isManager } = useRole();

  return isManager ? (
    <ManagerReviewQueue projectId={projectId} />
  ) : (
    <EmployeeSubmissions projectId={projectId} />
  );
}
