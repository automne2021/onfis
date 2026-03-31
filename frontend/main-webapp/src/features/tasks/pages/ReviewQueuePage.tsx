import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { useRole } from "../../../hooks/useRole";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/useToast";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";
import type { Task, ReviewComment } from "../types";
import { STATUS_CONFIG } from "../workflowUtils";
import { getReviewQueue, reviewTask, updateTask, type ApiTask, type ReviewQueueQuery } from "../../../services/taskService";

type ManagerFilter = "all" | "pending" | "approved" | "changes";
type EmployeeFilter = "all" | "under_review" | "approved" | "rework";
type ReviewStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "DONE";

const PAGE_SIZE = 20;

const MANAGER_FILTER_STATUS: Record<ManagerFilter, ReviewStatus[]> = {
  all: ["IN_REVIEW", "DONE", "IN_PROGRESS"],
  pending: ["IN_REVIEW"],
  approved: ["DONE"],
  changes: ["IN_PROGRESS"],
};

const EMPLOYEE_FILTER_STATUS: Record<EmployeeFilter, ReviewStatus[]> = {
  all: ["IN_REVIEW", "DONE", "IN_PROGRESS"],
  under_review: ["IN_REVIEW"],
  approved: ["DONE"],
  rework: ["IN_PROGRESS"],
};

interface ReviewTask extends Task {
  projectName: string;
  submittedAt: string;
  reviews: ReviewComment[];
}

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

const toReviewTask = (task: ApiTask): ReviewTask => ({
  id: task.id,
  key: task.key,
  projectTitle: task.projectTitle,
  projectSlug: task.projectSlug,
  title: task.title,
  description: task.description || "",
  priority: task.priority,
  status: task.status,
  progress: task.progress,
  startDateRaw: task.startDate,
  dueDateRaw: task.dueDate,
  dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-",
  assignees: task.assignees,
  tags: [],
  reporterId: task.reporterId,
  reporterName: task.reporterName,
  estimatedEffort: task.estimatedEffort,
  actualEffort: task.actualEffort,
  blockedBy: task.blockedBy,
  projectName: task.projectTitle || "Project",
  submittedAt: task.status === "IN_REVIEW" ? "Recently" : "-",
  reviews: task.reviews,
});

const toApiPriority = (priority: Task["priority"]): "URGENT" | "HIGH" | "MEDIUM" | "LOW" => {
  switch (priority) {
    case "urgent":
      return "URGENT";
    case "high":
      return "HIGH";
    case "low":
      return "LOW";
    default:
      return "MEDIUM";
  }
};

function convertToTaskDetail(task: ReviewTask): TaskDetail {
  return {
    ...task,
    subTasks: [],
    activities: [{ id: "a1", user: "System", action: "synced", description: "Synced from API", timestamp: "Recently" }],
    comments: [],
    createdAt: "",
    updatedAt: "",
    key: task.key || "TASK-000",
  };
}

function PaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 0}
        className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-xs text-neutral-500">
        Page {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page + 1 >= totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
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
        onClick={() => {
          setOpen(false);
          setReason("");
        }}
        className="px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
      >
        X
      </button>
    </div>
  );
}

function ManagerReviewQueue({ projectId }: { projectId: string | undefined }) {
  const { withTenant } = useTenantPath();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ManagerFilter>("all");
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filterOptions: { key: ManagerFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending Review" },
    { key: "approved", label: "Approved" },
    { key: "changes", label: "Changes Requested" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const query: ReviewQueueQuery = {
          projectId,
          status: MANAGER_FILTER_STATUS[filter],
          page,
          size: PAGE_SIZE,
          sortBy: "updatedAt",
          sortDir: "desc",
        };

        const reviewQueue = await getReviewQueue(query);
        setTasks(reviewQueue.content.map((task) => toReviewTask(task)));
        setTotalPages(reviewQueue.totalPages);
      } catch {
        showToast("Failed to load review queue", "error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [projectId, filter, page, showToast]);

  const pendingCount = tasks.filter((t) => t.status === "IN_REVIEW").length;

  const handleApprove = async (taskId: string) => {
    try {
      const updated = await reviewTask(taskId, { action: "APPROVED" });
      setTasks((prev) => prev
        .map((task) => (task.id === taskId ? toReviewTask(updated) : task))
        .filter((task) => (filter === "pending" ? task.id !== taskId : true))
      );
      showToast("Task approved and marked as DONE.", "success");
    } catch {
      showToast("Unable to approve task", "error");
    }
  };

  const handleRequestChanges = async (taskId: string, reason: string) => {
    try {
      const updated = await reviewTask(taskId, { action: "CHANGES_REQUESTED", content: reason });
      setTasks((prev) => prev
        .map((task) => (task.id === taskId ? toReviewTask(updated) : task))
        .filter((task) => (filter === "pending" ? task.id !== taskId : true))
      );
      showToast("Changes requested.", "warning");
    } catch {
      showToast("Unable to request changes", "error");
    }
  };

  const handleTaskSave = (updated: TaskDetail) => {
    const run = async () => {
      try {
        const saved = await updateTask(updated.id, {
          title: updated.title,
          description: updated.description,
          status: updated.status,
          priority: toApiPriority(updated.priority),
          progress: updated.progress,
          dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString().slice(0, 10) : undefined,
          reporterId: updated.reporterId,
          estimatedEffort: updated.estimatedEffort,
          actualEffort: updated.actualEffort,
          assigneeIds: updated.assignees.map((a) => a.id),
          tags: "[]",
        });
        setTasks((prev) => prev.map((task) => (task.id === saved.id ? toReviewTask(saved) : task)));
      } catch {
        showToast("Unable to update task", "error");
      }
    };
    void run();
  };

  return (
    <div className="onfis-section">
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Review Queue</h1>
            <p className="text-sm text-neutral-400 mt-0.5">Tasks submitted for your review</p>
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

      <div className="flex items-center gap-1 border-b border-neutral-200 mt-3">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
              onClick={() => {
                setFilter(opt.key);
                setPage(0);
              }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === opt.key
                ? "text-primary border-primary"
                : "text-neutral-500 border-transparent hover:text-neutral-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {!loading && tasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-xl border border-neutral-100">
            <span className="material-symbols-rounded text-neutral-300" style={{ fontSize: 48 }}>done_all</span>
            <p className="text-sm text-neutral-400">No tasks match this filter.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status];
            const lastReview = task.reviews[task.reviews.length - 1];
            return (
              <div key={task.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PRIORITY_COLOR[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(convertToTaskDetail(task));
                        setIsModalOpen(true);
                      }}
                      className="text-left font-semibold text-sm text-neutral-900 hover:text-primary transition-colors"
                    >
                      {task.title}
                    </button>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        task.priority === "urgent"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : task.priority === "high"
                          ? "bg-orange-50 text-orange-600 border-orange-200"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200"
                      }`}
                    >
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${statusCfg.color}`} />
                    <span className="text-xs font-medium text-neutral-600">{statusCfg.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    {task.assignees[0] && <Avatar name={task.assignees[0].name} avatar={task.assignees[0].avatar} size={20} />}
                    <span>{task.assignees[0]?.name ?? "Unassigned"}</span>
                  </div>
                  <span>-</span>
                  <span>{task.projectName}</span>
                  {lastReview?.content && (
                    <>
                      <span>-</span>
                      <span className="italic truncate max-w-[200px]">
                        "{lastReview.content.slice(0, 60)}{lastReview.content.length > 60 ? "..." : ""}"
                      </span>
                    </>
                  )}
                </div>

                {task.status === "IN_REVIEW" && (
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => void handleApprove(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check</span>
                      Approve
                    </button>
                    <RequestChangesInline onSubmit={(reason) => void handleRequestChanges(task.id, reason)} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 0))}
        onNext={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages - 1, 0)))}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleTaskSave}
        />
      )}
    </div>
  );
}

function EmployeeSubmissions({ projectId }: { projectId: string | undefined }) {
  const { withTenant } = useTenantPath();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<EmployeeFilter>("all");
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filterOptions: { key: EmployeeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "under_review", label: "Under Review" },
    { key: "approved", label: "Approved" },
    { key: "rework", label: "Rework Needed" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const query: ReviewQueueQuery = {
          projectId,
          status: EMPLOYEE_FILTER_STATUS[filter],
          page,
          size: PAGE_SIZE,
          sortBy: "updatedAt",
          sortDir: "desc",
        };

        const reviewQueue = await getReviewQueue(query);
        setTasks(reviewQueue.content.map((task) => toReviewTask(task)));
        setTotalPages(reviewQueue.totalPages);
      } catch {
        showToast("Failed to load your submissions", "error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [projectId, filter, page, showToast]);

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

      <div className="flex items-center gap-1 border-b border-neutral-200 mt-3">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setFilter(opt.key);
              setPage(0);
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === opt.key
                ? "text-primary border-primary"
                : "text-neutral-500 border-transparent hover:text-neutral-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {!loading && tasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-xl border border-neutral-100">
            <span className="material-symbols-rounded text-neutral-300" style={{ fontSize: 48 }}>rate_review</span>
            <p className="text-sm text-neutral-400">No submitted tasks match this filter.</p>
          </div>
        ) : (
          tasks.map((task) => {
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

                {lastReview && lastReview.content && (
                  <div className={`text-sm rounded-lg px-3 py-2 border ${
                    lastReview.action === "approved"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : lastReview.action === "changes_requested"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  }`}>
                    <span className="font-semibold">{lastReview.authorName}:</span> {lastReview.content}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-neutral-400 border-t border-neutral-100 pt-2">
                  <span>{task.projectName}</span>
                  <span>-</span>
                  <span>Due {task.dueDate}</span>
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

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 0))}
        onNext={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages - 1, 0)))}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(updated) => {
            const run = async () => {
              try {
                await updateTask(updated.id, {
                  title: updated.title,
                  description: updated.description,
                  status: updated.status,
                  priority: toApiPriority(updated.priority),
                  progress: updated.progress,
                  dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString().slice(0, 10) : undefined,
                  reporterId: updated.reporterId,
                  estimatedEffort: updated.estimatedEffort,
                  actualEffort: updated.actualEffort,
                  assigneeIds: updated.assignees.map((a) => a.id),
                  tags: "[]",
                });
              } catch {
                showToast("Unable to update task", "error");
              }
            };
            void run();
          }}
        />
      )}
    </div>
  );
}

export default function ReviewQueuePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { isManager } = useRole();
  const { currentUser } = useAuth();

  if (!currentUser.id) {
    return (
      <div className="onfis-section">
        <div className="mt-4 h-24 rounded-xl bg-neutral-100 animate-pulse" />
      </div>
    );
  }

  return isManager ? <ManagerReviewQueue projectId={projectId} /> : <EmployeeSubmissions projectId={projectId} />;
}
