import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRole } from "../../../hooks/useRole";
import { STATUS_CONFIG } from "../workflowUtils";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";
import type { Task } from "../types";
import { listMyTasks, reviewTask, updateTask, type ApiTask } from "../../../services/taskService";
import { useToast } from "../../../contexts/useToast";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";

type Tab = "assigned" | "created" | "reviewing";
type SortBy = "updatedAt" | "createdAt" | "dueDate" | "startDate" | "priority" | "status" | "title";
type SortDir = "asc" | "desc";

interface TaskPageMeta {
  totalElements: number;
  totalPages: number;
  size: number;
  hasNext: boolean;
}

const TAB_CONFIG: Record<Tab, { label: string; emptyIcon: string; emptyMsg: string }> = {
  assigned: {
    label: "Assigned to Me",
    emptyIcon: "task_alt",
    emptyMsg: "No tasks assigned to you right now.",
  },
  created: {
    label: "Created by Me",
    emptyIcon: "add_task",
    emptyMsg: "You haven't reported any tasks yet.",
  },
  reviewing: {
    label: "Reviewing",
    emptyIcon: "rate_review",
    emptyMsg: "No tasks awaiting your review.",
  },
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-50 text-red-700 border border-red-200",
  high: "bg-orange-50 text-orange-700 border border-orange-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-neutral-100 text-neutral-600 border border-neutral-200",
};

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    key: "status",
    label: "Status",
    type: "single",
    options: [
      { value: "TODO", label: "To Do", color: "bg-neutral-400" },
      { value: "IN_PROGRESS", label: "In Progress", color: "bg-primary" },
      { value: "BLOCKED", label: "Blocked", color: "bg-status-off_track" },
      { value: "IN_REVIEW", label: "In Review", color: "bg-status-on_track" },
      { value: "DONE", label: "Done", color: "bg-status-done" },
    ],
  },
  {
    key: "priority",
    label: "Priority",
    type: "single",
    options: [
      { value: "URGENT", label: "Urgent", color: "bg-[#E7000B]" },
      { value: "HIGH", label: "High", color: "bg-[#FF6900]" },
      { value: "MEDIUM", label: "Medium", color: "bg-[#FFD230]" },
      { value: "LOW", label: "Low", color: "bg-neutral-400" },
    ],
  },
];

const toTaskView = (task: ApiTask): Task => ({
  id: task.id,
  key: task.key,
  projectTitle: task.projectTitle,
  projectSlug: task.projectSlug,
  stageId: task.stageId ?? null,
  milestoneId: task.milestoneId ?? null,
  title: task.title,
  description: task.description || "",
  priority: task.priority,
  status: task.status,
  progress: task.progress,
  startDateRaw: task.startDate,
  dueDateRaw: task.dueDate,
  dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-",
  assignees: task.assignees,
  reporterId: task.reporterId,
  reporterName: task.reporterName,
  estimatedEffort: task.estimatedEffort,
  actualEffort: task.actualEffort,
  blockedBy: task.blockedBy,
  tags: [],
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

function convertToTaskDetail(task: Task): TaskDetail {
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

interface TaskItemRowProps {
  task: Task;
  onClick: () => void;
}

function TaskItemRow({ task, onClick }: TaskItemRowProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  return (
    <div
      className="grid grid-cols-[2fr_0.9fr_1fr_1fr_1fr] gap-3 items-center px-4 py-3 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-0"
      onClick={onClick}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{task.title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{task.projectTitle || "Project"}</p>
      </div>
      <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_BADGE[task.priority]}`}>
        {task.priority.replace("_", " ")}
      </span>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.color}`} />
        <span className="text-xs font-medium text-neutral-600">{statusCfg.label}</span>
      </div>
      <span className="text-xs text-neutral-500">{task.dueDate}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${task.progress}%` }} />
        </div>
        <span className="text-xs text-neutral-400 w-8 text-right flex-shrink-0">{task.progress}%</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="material-symbols-rounded text-neutral-300" style={{ fontSize: 48 }}>
        {icon}
      </span>
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
}

export default function MyTasksPage() {
  const { currentUser } = useAuth();
  const { isManager, isAuthLoading } = useRole();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("assigned");
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    status: [],
    priority: [],
  });
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [pageMeta, setPageMeta] = useState<TaskPageMeta>({
    totalElements: 0,
    totalPages: 0,
    size: 10,
    hasNext: false,
  });

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    setActiveTab(isManager ? "created" : "assigned");
    setPage(0);
  }, [isAuthLoading, isManager]);

  const statusFilter = activeFilters.status?.[0] ?? "";
  const priorityFilter = activeFilters.priority?.[0] ?? "";

  const loadTasks = useCallback(async () => {
    if (isAuthLoading || !currentUser.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await listMyTasks({
        tab: activeTab,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        size: 10,
        sortBy,
        sortDir,
      });

      setTasks(response.content.map(toTaskView));
      setPageMeta({
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        size: response.size,
        hasNext: response.hasNext,
      });
    } catch {
      setError("Failed to load tasks from server.");
      setTasks([]);
      setPageMeta({ totalElements: 0, totalPages: 0, size: 10, hasNext: false });
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser.id, isAuthLoading, page, priorityFilter, searchQuery, sortBy, sortDir, statusFilter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const paginationSummary = useMemo(() => {
    if (pageMeta.totalElements === 0) {
      return "0-0 of 0";
    }
    const start = page * pageMeta.size + 1;
    const end = Math.min((page + 1) * pageMeta.size, pageMeta.totalElements);
    return `${start}-${end} of ${pageMeta.totalElements}`;
  }, [page, pageMeta]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(convertToTaskDetail(task));
    setIsModalOpen(true);
  };

  const handleTaskSave = (updated: TaskDetail) => {
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

        if (updated.reviews && updated.reviews.length > 0) {
          const latest = updated.reviews[updated.reviews.length - 1];
          if (latest.action === "approved" || latest.action === "changes_requested") {
            await reviewTask(updated.id, {
              action: latest.action === "approved" ? "APPROVED" : "CHANGES_REQUESTED",
              content: latest.content,
            });
          }
        }
        await loadTasks();
        showToast("Task updated", "success");
      } catch {
        showToast("Unable to update task", "error");
      }
    };

    void run();
  };

  return (
    <div className="onfis-section">
      <div className="navbar-style">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Tasks</h1>
          <p className="text-sm text-neutral-400 mt-0.5">All your tasks across every project</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 mt-3 overflow-hidden">
        <div className="flex border-b border-neutral-200 px-4 pt-3">
          {(Object.keys(TAB_CONFIG) as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab ? "text-primary border-primary" : "text-neutral-500 border-transparent hover:text-neutral-800"
              }`}
            >
              {TAB_CONFIG[tab].label}
              {activeTab === tab && pageMeta.totalElements > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                  {pageMeta.totalElements}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search by title, key, project"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />

              <FilterDropdown
                categories={FILTER_CATEGORIES}
                activeFilters={activeFilters}
                onFiltersChange={(filters) => {
                  setActiveFilters(filters);
                  setPage(0);
                }}
              />
            </div>

            <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortBy);
                setPage(0);
              }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="updatedAt">Sort: Updated</option>
              <option value="createdAt">Sort: Created</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="startDate">Sort: Start Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="status">Sort: Status</option>
              <option value="title">Sort: Title</option>
            </select>

            <select
              value={sortDir}
              onChange={(event) => {
                setSortDir(event.target.value as SortDir);
                setPage(0);
              }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="px-4 py-4 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-neutral-100 animate-pulse" />
            ))}
          </div>
        )}
        {error && !loading && <div className="px-4 py-8 text-sm text-red-500">{error}</div>}

        {!loading && !error && tasks.length > 0 && (
          <div className="grid grid-cols-[2fr_0.9fr_1fr_1fr_1fr] gap-3 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Task</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Priority</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Due</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Progress</span>
          </div>
        )}

        <div>
          {!loading && !error && tasks.length === 0 ? (
            <EmptyState icon={TAB_CONFIG[activeTab].emptyIcon} message={TAB_CONFIG[activeTab].emptyMsg} />
          ) : (
            tasks.map((task) => (
              <TaskItemRow
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
              />
            ))
          )}
        </div>

        {!loading && !error && pageMeta.totalPages > 0 && (
          <div className="px-4 py-3 border-t border-neutral-100 bg-white flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">Showing {paginationSummary}</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-xs text-neutral-500">
                Page {page + 1} / {Math.max(pageMeta.totalPages, 1)}
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pageMeta.hasNext}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
