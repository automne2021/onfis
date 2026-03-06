import { useState, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import MyTasksToolbar from "../components/MyTasksToolbar";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components/TaskDetailModal/types";
import type { Task, TaskStatus } from "../types";

// Mock data — tasks assigned to the current user
const allMockTasks: (Task & { projectName: string })[] = [
    {
        id: "mt-1",
        title: "Design homepage wireframes",
        description: "Create wireframe mockups for the new homepage layout including hero section, features grid, and testimonials.",
        priority: "high",
        status: "IN_PROGRESS",
        progress: 65,
        dueDate: "Mar 15, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "3",
        estimatedEffort: 16,
        actualEffort: 10,
        tags: [{ id: "t1", type: "department", label: "Design" }],
        projectName: "ABC Website",
    },
    {
        id: "mt-2",
        title: "Implement user authentication",
        description: "Set up OAuth2 login with Google and GitHub providers, including session management.",
        priority: "urgent",
        status: "TODO",
        progress: 0,
        dueDate: "Mar 20, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "2",
        estimatedEffort: 24,
        actualEffort: 0,
        tags: [{ id: "t2", type: "department", label: "Backend" }],
        projectName: "ERP Migration",
    },
    {
        id: "mt-3",
        title: "Design system components",
        description: "Build reusable component library including buttons, inputs, modals, and cards.",
        priority: "medium",
        status: "IN_REVIEW",
        progress: 100,
        dueDate: "Mar 10, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "3",
        estimatedEffort: 20,
        actualEffort: 22,
        tags: [{ id: "t3", type: "department", label: "Frontend" }],
        projectName: "ABC Website",
    },
    {
        id: "mt-4",
        title: "API documentation",
        description: "Write comprehensive API documentation for all REST endpoints using OpenAPI spec.",
        priority: "low",
        status: "DONE",
        progress: 100,
        dueDate: "Mar 5, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "2",
        estimatedEffort: 8,
        actualEffort: 7,
        tags: [{ id: "t4", type: "scope", label: "Internal" }],
        projectName: "ERP Migration",
    },
    {
        id: "mt-5",
        title: "Database schema migration",
        description: "Migrate legacy database schema to new normalized structure with proper indexing.",
        priority: "high",
        status: "IN_PROGRESS",
        progress: 40,
        dueDate: "Mar 25, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "3",
        estimatedEffort: 32,
        actualEffort: 12,
        tags: [{ id: "t5", type: "department", label: "Backend" }],
        projectName: "ERP Migration",
    },
    {
        id: "mt-6",
        title: "Mobile responsive fixes",
        description: "Fix layout issues on mobile breakpoints across all main pages.",
        priority: "medium",
        status: "BLOCKED",
        progress: 20,
        dueDate: "Mar 18, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "2",
        estimatedEffort: 12,
        actualEffort: 3,
        blockedBy: ["mt-1"],
        tags: [{ id: "t6", type: "department", label: "Frontend" }],
        projectName: "Mobile App",
    },
];

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string; bgColor: string }[] = [
    { status: "TODO", label: "To Do", color: "bg-neutral-400", bgColor: "bg-neutral-50" },
    { status: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500", bgColor: "bg-blue-50/50" },
    { status: "IN_REVIEW", label: "In Review", color: "bg-amber-500", bgColor: "bg-amber-50/50" },
    { status: "DONE", label: "Done", color: "bg-green-500", bgColor: "bg-green-50/50" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    urgent: { label: "Urgent", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    high: { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    low: { label: "Low", color: "text-neutral-600", bg: "bg-neutral-100 border-neutral-200" },
};

export default function MyTasksPage() {
    const { currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"board" | "list">("board");
    const [tasks, setTasks] = useState(allMockTasks);
    const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter tasks by search
    const filteredTasks = useMemo(() => {
        if (!searchQuery.trim()) return tasks;
        const q = searchQuery.toLowerCase();
        return tasks.filter(
            (t) => t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q)
        );
    }, [tasks, searchQuery]);

    // Group by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, typeof filteredTasks> = {
            TODO: [],
            IN_PROGRESS: [],
            BLOCKED: [],
            IN_REVIEW: [],
            DONE: [],
        };
        filteredTasks.forEach((t) => {
            if (t.status === "BLOCKED") {
                grouped.IN_PROGRESS.push(t); // Show blocked tasks in the In Progress column
            } else {
                grouped[t.status].push(t);
            }
        });
        return grouped;
    }, [filteredTasks]);

    const convertToTaskDetail = (task: Task & { projectName: string }): TaskDetail => ({
        ...task,
        subTasks: [],
        activities: [
            {
                id: "act-1",
                user: "Sarah Jenkins",
                action: "changed status to",
                value: task.status,
                timestamp: "2 hours ago",
            },
        ],
        comments: [],
        createdAt: "Feb 20, 2026 9:00 AM",
        updatedAt: "4 hours ago",
        key: `TASK-${task.id.split("-")[1]}`,
    });

    const handleTaskClick = (task: Task & { projectName: string }) => {
        setSelectedTask(convertToTaskDetail(task));
        setIsModalOpen(true);
    };

    const handleTaskSave = (updatedTask: TaskDetail) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === updatedTask.id
                    ? { ...t, ...updatedTask, projectName: (t as typeof allMockTasks[0]).projectName }
                    : t
            )
        );
    };

    const handleSubmitForReview = (task: Task & { projectName: string }) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === task.id ? { ...t, status: "IN_REVIEW" as TaskStatus, progress: 100 } : t
            )
        );
    };

    const handleApproveTask = (task: Task & { projectName: string }) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === task.id ? { ...t, status: "DONE" as TaskStatus } : t
            )
        );
    };

    const isManager = currentUser.role === "manager";

    return (
        <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto gap-3 relative">
            <MyTasksToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {viewMode === "board" ? (
                /* Board View */
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-3 h-full min-w-max pb-2 px-1">
                        {STATUS_COLUMNS.map(({ status, label, color, bgColor }) => {
                            const columnTasks = tasksByStatus[status];
                            return (
                                <div
                                    key={status}
                                    className={`flex flex-col w-[310px] rounded-xl border border-neutral-200 ${bgColor} overflow-hidden`}
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200/60">
                                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                        <span className="text-sm font-semibold text-neutral-800">{label}</span>
                                        <span className="ml-auto text-xs font-medium text-neutral-400 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                                            {columnTasks.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar">
                                        {columnTasks.length === 0 ? (
                                            <div className="flex items-center justify-center py-8 text-neutral-400 text-xs">
                                                No tasks
                                            </div>
                                        ) : (
                                            columnTasks.map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onClick={() => handleTaskClick(task)}
                                                    onSubmitForReview={
                                                        !isManager && task.status === "IN_PROGRESS" ? () => handleSubmitForReview(task) : undefined
                                                    }
                                                    onApprove={
                                                        isManager && task.status === "IN_REVIEW" ? () => handleApproveTask(task) : undefined
                                                    }
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="flex-1 overflow-y-auto px-1">
                    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_140px_100px_100px_80px_120px] gap-2 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            <span>Task</span>
                            <span>Project</span>
                            <span>Status</span>
                            <span>Priority</span>
                            <span>Progress</span>
                            <span>Due Date</span>
                        </div>

                        {/* Table Rows */}
                        {filteredTasks.length === 0 ? (
                            <div className="flex items-center justify-center py-12 text-neutral-400 text-sm">
                                No tasks found
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => handleTaskClick(task)}
                                    className="grid grid-cols-[1fr_140px_100px_100px_80px_120px] gap-2 px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors items-center"
                                >
                                    <span className="text-sm font-medium text-neutral-900 truncate">{task.title}</span>
                                    <span className="text-xs text-neutral-500 truncate">{task.projectName}</span>
                                    <StatusBadge status={task.status} />
                                    <PriorityBadge priority={task.priority} />
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${task.progress >= 75 ? "bg-green-500" : task.progress >= 50 ? "bg-blue-500" : "bg-primary"}`}
                                                style={{ width: `${task.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-medium text-neutral-500 w-7 text-right">{task.progress}%</span>
                                    </div>
                                    <span className="text-xs text-neutral-500">{task.dueDate}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
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

// ─── Sub-components ─────────────────────────────────────────────

function TaskCard({
    task,
    onClick,
    onSubmitForReview,
    onApprove,
}: {
    task: typeof allMockTasks[0];
    onClick: () => void;
    onSubmitForReview?: () => void;
    onApprove?: () => void;
}) {
    const priorityCfg = PRIORITY_CONFIG[task.priority];

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-neutral-200 p-3.5 cursor-pointer hover:shadow-md hover:border-neutral-300 transition-all duration-200 group"
        >
            {/* Project label */}
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                {task.projectName}
            </span>

            {/* Title */}
            <h4 className="text-sm font-semibold text-neutral-900 mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {task.title}
            </h4>

            {/* Priority + Due Date */}
            <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityCfg.bg} ${priorityCfg.color}`}>
                    {priorityCfg.label}
                </span>
                <span className="text-[10px] text-neutral-400 ml-auto">
                    {task.dueDate}
                </span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${task.progress >= 75 ? "bg-green-500" : task.progress >= 50 ? "bg-blue-500" : "bg-primary"}`}
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-medium text-neutral-500">{task.progress}%</span>
            </div>

            {/* Blocked indicator */}
            {task.status === "BLOCKED" && (
                <div className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-500 text-xs">🚫</span>
                    <span className="text-[10px] font-medium text-red-600">Blocked</span>
                </div>
            )}

            {/* Quick actions */}
            {onSubmitForReview && (
                <button
                    onClick={(e) => { e.stopPropagation(); onSubmitForReview(); }}
                    className="w-full mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                >
                    ↗ Submit for Review
                </button>
            )}
            {onApprove && (
                <button
                    onClick={(e) => { e.stopPropagation(); onApprove(); }}
                    className="w-full mt-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors"
                >
                    ✓ Quick Approve
                </button>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: TaskStatus }) {
    const config: Record<TaskStatus, { label: string; cls: string }> = {
        TODO: { label: "To Do", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
        IN_PROGRESS: { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
        BLOCKED: { label: "Blocked", cls: "bg-red-50 text-red-700 border-red-200" },
        IN_REVIEW: { label: "In Review", cls: "bg-amber-50 text-amber-700 border-amber-200" },
        DONE: { label: "Done", cls: "bg-green-50 text-green-700 border-green-200" },
    };
    const c = config[status];
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.cls} inline-block w-fit`}>
            {c.label}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const cfg = PRIORITY_CONFIG[priority];
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} inline-block w-fit`}>
            {cfg.label}
        </span>
    );
}
