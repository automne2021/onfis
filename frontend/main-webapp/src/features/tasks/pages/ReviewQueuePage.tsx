import { useState, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { SearchIcon } from "../../../components/common/Icons";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components/TaskDetailModal/types";
import type { Task } from "../types";
import { useToast } from "../../../contexts/useToast";

const FILTER_CATEGORIES: FilterCategory[] = [
    {
        key: "priority",
        label: "Priority",
        options: [
            { value: "urgent", label: "Urgent", color: "bg-red-500" },
            { value: "high", label: "High", color: "bg-[#FF6900]" },
            { value: "medium", label: "Medium", color: "bg-[#FFD230]" },
            { value: "low", label: "Low", color: "bg-neutral-400" },
        ],
    },
    {
        key: "project",
        label: "Project",
        options: [
            { value: "abc", label: "ABC Website" },
            { value: "erp", label: "ERP Migration" },
        ],
    },
];

// Mock review queue tasks (where reporterId matches the manager)
const mockReviewTasks: (Task & { projectName: string; submittedDate: string; submittedBy: string })[] = [
    {
        id: "rv-1",
        title: "Design system components",
        description: "Build reusable component library including buttons, inputs, modals, and cards.",
        priority: "medium",
        status: "IN_REVIEW",
        progress: 100,
        dueDate: "Mar 10, 2026",
        assignees: [{ id: "2", name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" }],
        reporterId: "1",
        estimatedEffort: 20,
        actualEffort: 22,
        tags: [{ id: "t1", type: "department", label: "Frontend" }],
        projectName: "ABC Website",
        submittedDate: "Mar 7, 2026",
        submittedBy: "John Doe",
    },
    {
        id: "rv-2",
        title: "API endpoint documentation",
        description: "Write OpenAPI docs for all REST endpoints including examples and error responses.",
        priority: "high",
        status: "IN_REVIEW",
        progress: 100,
        dueDate: "Mar 12, 2026",
        assignees: [{ id: "3", name: "Alice Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" }],
        reporterId: "1",
        estimatedEffort: 12,
        actualEffort: 14,
        tags: [{ id: "t2", type: "scope", label: "Internal" }],
        projectName: "ERP Migration",
        submittedDate: "Mar 6, 2026",
        submittedBy: "Alice Smith",
    },
    {
        id: "rv-3",
        title: "User onboarding flow",
        description: "Design and implement the new user onboarding wizard with step-by-step guidance.",
        priority: "urgent",
        status: "IN_REVIEW",
        progress: 100,
        dueDate: "Mar 8, 2026",
        assignees: [{ id: "4", name: "Bob Wilson" }],
        reporterId: "1",
        estimatedEffort: 16,
        actualEffort: 18,
        tags: [{ id: "t3", type: "department", label: "Design" }],
        projectName: "ABC Website",
        submittedDate: "Mar 5, 2026",
        submittedBy: "Bob Wilson",
    },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    urgent: { label: "Urgent", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    high: { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    low: { label: "Low", color: "text-neutral-600", bg: "bg-neutral-100 border-neutral-200" },
};

export default function ReviewQueuePage() {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
    const [tasks, setTasks] = useState(mockReviewTasks);
    const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const isManager = currentUser.role === "manager";

    // Filter
    const filteredTasks = useMemo(() => {
        let result = tasks;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (t) => t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q)
            );
        }
        return result;
    }, [tasks, searchQuery]);

    const convertToTaskDetail = (task: Task & { projectName: string }): TaskDetail => ({
        ...task,
        subTasks: [],
        activities: [
            {
                id: "act-1",
                user: (task as typeof mockReviewTasks[0]).submittedBy || "Unknown",
                action: "submitted for review",
                timestamp: (task as typeof mockReviewTasks[0]).submittedDate || "Recently",
            },
        ],
        comments: [],
        createdAt: "Feb 20, 2026 9:00 AM",
        updatedAt: (task as typeof mockReviewTasks[0]).submittedDate || "Recently",
        key: `RV-${task.id.split("-")[1]}`,
    });

    const handleApprove = (taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        showToast("Task approved and marked as Done! ✓", "success");
    };

    const handleReject = (taskId: string) => {
        if (!rejectionReason.trim()) return;
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setRejectingTaskId(null);
        setRejectionReason("");
        showToast("Task returned with feedback.", "warning");
    };

    const handleTaskClick = (task: typeof mockReviewTasks[0]) => {
        setSelectedTask(convertToTaskDetail(task));
        setIsModalOpen(true);
    };

    const handleTaskSave = (updatedTask: TaskDetail) => {
        if (updatedTask.status === "DONE") {
            setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
        }
    };

    // Access denied for employees
    if (!isManager) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900">Access Restricted</h2>
                <p className="text-sm text-neutral-500 text-center max-w-sm">
                    The Review Queue is only available to managers. Please contact your manager if you have questions about your task reviews.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto gap-3 relative">
            {/* Toolbar */}
            <div className="bg-white grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-300">
                <div className="flex items-center gap-2">
                    <nav className="flex items-center h-7">
                        <span className="text-primary font-medium text-xs">Review Queue</span>
                    </nav>
                    <span className="text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
                        {filteredTasks.length} pending
                    </span>
                </div>

                <div className="justify-self-center w-[260px] lg:w-[380px]">
                    <div className="bg-white border border-neutral-200 rounded-[8px] flex items-center gap-1.5 px-2 h-7">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-neutral-900 text-xs font-normal placeholder:text-neutral-400"
                        />
                    </div>
                </div>

                <FilterDropdown
                    categories={FILTER_CATEGORIES}
                    activeFilters={activeFilters}
                    onFiltersChange={setActiveFilters}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-1">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900">All caught up!</h3>
                        <p className="text-sm text-neutral-500">No tasks are pending review right now.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {filteredTasks.map((task) => {
                            const priorityCfg = PRIORITY_CONFIG[task.priority];
                            const isRejecting = rejectingTaskId === task.id;

                            return (
                                <div
                                    key={task.id}
                                    className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:shadow-sm transition-all"
                                >
                                    {/* Main row */}
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                                        onClick={() => handleTaskClick(task)}
                                    >
                                        {/* Assignee avatar */}
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold overflow-hidden flex-shrink-0">
                                            {task.assignees[0]?.avatar ? (
                                                <img src={task.assignees[0].avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                task.assignees[0]?.name.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {/* Task info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-neutral-900 truncate">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-neutral-400">{task.projectName}</span>
                                                <span className="text-neutral-300">•</span>
                                                <span className="text-[10px] text-neutral-400">by {task.submittedBy}</span>
                                                <span className="text-neutral-300">•</span>
                                                <span className="text-[10px] text-neutral-400">{task.submittedDate}</span>
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityCfg.bg} ${priorityCfg.color} flex-shrink-0`}>
                                            {priorityCfg.label}
                                        </span>

                                        {/* Effort */}
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <span className="text-xs font-medium text-neutral-700">{task.actualEffort}h / {task.estimatedEffort}h</span>
                                            <span className={`text-[10px] ${(task.actualEffort ?? 0) > (task.estimatedEffort ?? 0) ? "text-red-500 font-bold" : "text-neutral-400"}`}>
                                                {(task.actualEffort ?? 0) > (task.estimatedEffort ?? 0) ? "Over budget" : "Within estimate"}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleApprove(task.id)}
                                                className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectingTaskId(isRejecting ? null : task.id)}
                                                className={`px-3 py-1.5 border text-xs font-bold rounded-lg transition-colors ${isRejecting
                                                    ? "bg-red-50 border-red-200 text-red-700"
                                                    : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                                    }`}
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rejection expand */}
                                    {isRejecting && (
                                        <div className="px-5 pb-4 pt-0 border-t border-neutral-100">
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                                                <p className="text-sm font-medium text-amber-800 mb-2">
                                                    Provide feedback for rejection:
                                                </p>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="Explain what needs to be revised..."
                                                    className="w-full min-h-[80px] p-3 text-sm text-neutral-900 border border-amber-200 rounded-lg resize-none outline-none focus:border-amber-400 bg-white"
                                                />
                                                <div className="flex items-center gap-2 justify-end mt-2">
                                                    <button
                                                        onClick={() => { setRejectingTaskId(null); setRejectionReason(""); }}
                                                        className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(task.id)}
                                                        disabled={!rejectionReason.trim()}
                                                        className="px-4 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Return with Feedback
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
