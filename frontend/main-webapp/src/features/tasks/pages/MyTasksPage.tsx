import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRole } from "../../../hooks/useRole";
import { STATUS_CONFIG } from "../workflowUtils";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";
import type { Task, TaskStatus } from "../types";
import { listMyTasks, reviewTask, updateTask, type ApiTask } from "../../../services/taskService";
import { useToast } from "../../../contexts/useToast";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { formatVNDate } from "../../../utils/getTime";

type Tab = "assigned" | "created";
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
};

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string; bg: string }[] = [
  { status: "TODO",        label: "To Do",       color: "text-neutral-500", bg: "bg-neutral-100" },
  { status: "IN_PROGRESS", label: "In Progress",  color: "text-blue-600",   bg: "bg-blue-50"     },
  { status: "BLOCKED",     label: "Blocked",      color: "text-red-600",    bg: "bg-red-50"      },
  { status: "IN_REVIEW",   label: "In Review",    color: "text-amber-600",  bg: "bg-amber-50"    },
  { status: "DONE",        label: "Done",         color: "text-green-600",  bg: "bg-green-50"    },
];

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
  dueDate: task.dueDate ? formatVNDate(task.dueDate) : "-",
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
    case "urgent": return "URGENT";
    case "high":   return "HIGH";
    case "low":    return "LOW";
    default:       return "MEDIUM";
  }
};

function convertToTaskDetail(task: Task): TaskDetail {
  return {
    ...task,
    subTasks: [],
    activities: [],
    comments: [],
    createdAt: "",
    updatedAt: "",
    key: task.key || "TASK-000",
  };
}

// ── Kanban Card ─────────────────────────────────────────────────────────

interface KanbanCardProps {
  task: Task;
  onOpen: () => void;
  onDragStart: (task: Task) => void;
}

function KanbanCard({ task, onOpen, onDragStart }: KanbanCardProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={onOpen}
      className="bg-white rounded-xl border border-neutral-200 p-3 cursor-pointer hover:border-neutral-300 hover:shadow-sm transition-all select-none active:opacity-70"
    >
      <p className="text-sm font-medium text-neutral-900 line-clamp-2 mb-2">{task.title}</p>
      {task.projectTitle && (
        <p className="text-[11px] text-neutral-400 mb-2 truncate">{task.projectTitle}</p>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_BADGE[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && task.dueDate !== "-" && (
          <span className="text-[11px] text-neutral-400">{task.dueDate}</span>
        )}
      </div>
      {task.progress > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${task.progress >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${task.progress}%` }} />
          </div>
          <span className="text-[10px] text-neutral-400">{task.progress}%</span>
        </div>
      )}
      {task.status === "BLOCKED" && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.color}`} />
          <span className="text-[11px] text-red-600 font-medium">Blocked</span>
        </div>
      )}
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  bg: string;
  tasks: Task[];
  searchQuery: string;
  onOpenTask: (task: Task) => void;
  onDragStart: (task: Task) => void;
  onDrop: (targetStatus: TaskStatus) => void;
}

function KanbanColumn({ status, label, color, bg, tasks, searchQuery, onOpenTask, onDragStart, onDrop }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(q) || t.projectTitle?.toLowerCase().includes(q) || t.key?.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  return (
    <div
      className={`flex flex-col w-[220px] min-w-[220px] flex-shrink-0 rounded-xl border transition-colors ${isDragOver ? "border-primary bg-primary/5" : "border-neutral-200 bg-neutral-50"}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => { setIsDragOver(false); onDrop(status); }}
    >
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${bg}`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/70 ${color}`}>{filteredTasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {filteredTasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            onOpen={() => onOpenTask(task)}
            onDragStart={onDragStart}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="py-6 text-center text-xs text-neutral-300">No tasks</div>
        )}
      </div>
    </div>
  );
}

// ── Status Change Confirmation Modal ──────────────────────────────────────

interface MoveConfirmProps {
  task: Task;
  targetStatus: TaskStatus;
  onConfirm: () => void;
  onCancel: () => void;
}

function MoveConfirmModal({ task, targetStatus, onConfirm, onCancel }: MoveConfirmProps) {
  const cfg = STATUS_CONFIG[targetStatus];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-slideUp">
        <h3 className="text-base font-bold text-neutral-900 mb-2">Move Task</h3>
        <p className="text-sm text-neutral-600 mb-1">
          Move <span className="font-medium text-neutral-900">"{task.title}"</span>
        </p>
        <p className="text-sm text-neutral-600 mb-4">
          to <span className={`inline-flex items-center gap-1 font-semibold`}>
            <span className={`w-2 h-2 rounded-full inline-block ${cfg.color}`} />
            {cfg.label}
          </span>?
        </p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Board ──────────────────────────────────────────────────────────

interface KanbanBoardProps {
  tasks: Task[];
  loading: boolean;
  searchQuery: string;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

function KanbanBoard({ tasks, loading, searchQuery, onOpenTask, onStatusChange }: KanbanBoardProps) {
  const draggedTaskRef = useRef<Task | null>(null);
  const [pendingMove, setPendingMove] = useState<{ task: Task; targetStatus: TaskStatus } | null>(null);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TODO: [], IN_PROGRESS: [], BLOCKED: [], IN_REVIEW: [], DONE: [],
    };
    tasks.forEach(t => { map[t.status].push(t); });
    return map;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map(col => (
          <div key={col.status} className="w-[220px] min-w-[220px] h-64 rounded-xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            {...col}
            tasks={tasksByStatus[col.status]}
            searchQuery={searchQuery}
            onOpenTask={onOpenTask}
            onDragStart={(task) => { draggedTaskRef.current = task; }}
            onDrop={(targetStatus) => {
              const task = draggedTaskRef.current;
              draggedTaskRef.current = null;
              if (!task || task.status === targetStatus) return;
              setPendingMove({ task, targetStatus });
            }}
          />
        ))}
      </div>
      {pendingMove && (
        <MoveConfirmModal
          task={pendingMove.task}
          targetStatus={pendingMove.targetStatus}
          onConfirm={() => {
            onStatusChange(pendingMove.task, pendingMove.targetStatus);
            setPendingMove(null);
          }}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </>
  );
}

// ── List View Row ─────────────────────────────────────────────────────────

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

// ── Main Page ─────────────────────────────────────────────────────────────

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

  const topRef = useRef<HTMLDivElement>(null);

  const isKanbanView = activeTab === "assigned";

  useEffect(() => {
    if (isAuthLoading) return;
    setActiveTab(isManager ? "created" : "assigned");
    setPage(0);
  }, [isAuthLoading, isManager]);

  const statusFilter = activeFilters.status?.[0] ?? "";
  const priorityFilter = activeFilters.priority?.[0] ?? "";

  const loadTasks = useCallback(async () => {
    if (isAuthLoading || !currentUser.id) return;

    try {
      setLoading(true);
      setError(null);
      // For kanban view, load all tasks at once (up to 200 per request)
      const pageSize = isKanbanView ? 200 : 10;
      const response = await listMyTasks({
        tab: activeTab,
        search: searchQuery || undefined,
        status: !isKanbanView && statusFilter ? statusFilter : undefined,
        priority: !isKanbanView && priorityFilter ? priorityFilter : undefined,
        page: isKanbanView ? 0 : page,
        size: pageSize,
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
  }, [activeTab, currentUser.id, isAuthLoading, isKanbanView, page, priorityFilter, searchQuery, sortBy, sortDir, statusFilter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const paginationSummary = useMemo(() => {
    if (pageMeta.totalElements === 0) return "0-0 of 0";
    const start = page * pageMeta.size + 1;
    const end = Math.min((page + 1) * pageMeta.size, pageMeta.totalElements);
    return `${start}-${end} of ${pageMeta.totalElements}`;
  }, [page, pageMeta]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(0);
    setSearchQuery("");
    setActiveFilters({ status: [], priority: [] });
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
          dueDate: updated.dueDateRaw ?? undefined,
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

  const handleKanbanStatusChange = (task: Task, newStatus: TaskStatus) => {
    const run = async () => {
      try {
        await updateTask(task.id, {
          title: task.title,
          description: task.description,
          status: newStatus,
          priority: toApiPriority(task.priority),
          progress: task.progress,
          dueDate: task.dueDateRaw ?? undefined,
          reporterId: task.reporterId,
          estimatedEffort: task.estimatedEffort,
          actualEffort: task.actualEffort,
          assigneeIds: task.assignees.map((a) => a.id),
          tags: "[]",
        });
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        showToast("Task status updated", "success");
      } catch {
        showToast("Unable to update task status", "error");
        await loadTasks();
      }
    };
    void run();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="onfis-section" ref={topRef}>
      <div className="navbar-style">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Tasks</h1>
          <p className="text-sm text-neutral-400 mt-0.5">All your tasks across every project</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 mt-3 overflow-hidden">
        {/* Tabs */}
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

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setPage(0); }}
                placeholder="Search by title, key, project"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {!isKanbanView && (
                <FilterDropdown
                  categories={FILTER_CATEGORIES}
                  activeFilters={activeFilters}
                  onFiltersChange={(filters) => { setActiveFilters(filters); setPage(0); }}
                />
              )}
            </div>

            {!isKanbanView && (
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(event) => { setSortBy(event.target.value as SortBy); setPage(0); }}
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
                  onChange={(event) => { setSortDir(event.target.value as SortDir); setPage(0); }}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Kanban Board — "Assigned to Me" tab */}
        {isKanbanView && (
          <div className="p-4">
            {error && !loading && <div className="py-8 text-sm text-red-500">{error}</div>}
            <KanbanBoard
              tasks={tasks}
              loading={loading}
              searchQuery={searchQuery}
              onOpenTask={handleTaskClick}
              onStatusChange={handleKanbanStatusChange}
            />
          </div>
        )}

        {/* List View — "Created by Me" tab */}
        {!isKanbanView && (
          <>
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
                  <TaskItemRow key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                ))
              )}
            </div>

            {!loading && !error && pageMeta.totalPages > 0 && (
              <div className="px-4 py-3 border-t border-neutral-100 bg-white flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-neutral-500">Showing {paginationSummary}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(0, page - 1))}
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
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!pageMeta.hasNext}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
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
