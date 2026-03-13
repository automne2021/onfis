import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRole } from "../../../hooks/useRole";
import { STATUS_CONFIG } from "../workflowUtils";
import { TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";
import type { Stage, Task } from "../types";

// Mock cross-project task data — current user id is "1"
const mockAllStages: Stage[] = [
  {
    id: "stage-1",
    title: "Stage 1 — ABC Website",
    tasks: [
      {
        id: "task-1",
        title: "Design homepage wireframes",
        description: "Create UI/UX design for the main landing pages",
        priority: "high",
        status: "IN_PROGRESS",
        progress: 75,
        dueDate: "Mar 20, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "3",
        estimatedEffort: 16,
        actualEffort: 12,
        tags: [{ id: "t1", type: "department", label: "Design" }],
      },
      {
        id: "task-2",
        title: "Design system components",
        description: "Build shared component library and design tokens",
        priority: "medium",
        status: "IN_REVIEW",
        progress: 100,
        dueDate: "Mar 15, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "1",
        estimatedEffort: 8,
        actualEffort: 10,
        tags: [{ id: "t2", type: "scope", label: "Internal" }],
      },
    ],
  },
  {
    id: "stage-2",
    title: "Stage 2 — ABC Website",
    tasks: [
      {
        id: "task-3",
        title: "Frontend implementation",
        description: "Implement approved designs using React and Tailwind",
        priority: "urgent",
        status: "TODO",
        progress: 0,
        dueDate: "Apr 1, 2026",
        assignees: [{ id: "2", name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" }],
        reporterId: "1",
        estimatedEffort: 40,
        actualEffort: 0,
        tags: [{ id: "t3", type: "department", label: "Frontend" }],
      },
      {
        id: "task-4",
        title: "Backend API integration",
        description: "Connect frontend to REST APIs",
        priority: "high",
        status: "IN_REVIEW",
        progress: 90,
        dueDate: "Apr 5, 2026",
        assignees: [{ id: "3", name: "Alice Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" }],
        reporterId: "1",
        estimatedEffort: 24,
        actualEffort: 22,
        tags: [{ id: "t4", type: "scope", label: "External" }],
      },
      {
        id: "task-5",
        title: "QA and bug fixing sprint",
        description: "Full regression testing before release",
        priority: "medium",
        status: "TODO",
        progress: 0,
        dueDate: "Apr 15, 2026",
        assignees: [{ id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }],
        reporterId: "2",
        estimatedEffort: 20,
        actualEffort: 0,
        tags: [{ id: "t5", type: "scope", label: "QA" }],
      },
    ],
  },
];

const PROJECT_LABELS: Record<string, string> = {
  "stage-1": "ABC Website",
  "stage-2": "ABC Website",
};

type Tab = "assigned" | "created" | "reviewing";

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

function convertToTaskDetail(task: Task): TaskDetail {
  return {
    ...task,
    subTasks: [],
    activities: [
      { id: "a1", user: "System", action: "created this task", timestamp: "Recently" },
    ],
    comments: [],
    createdAt: "Mar 1, 2026",
    updatedAt: "Recently",
    key: `TASK-${task.id.toUpperCase()}`,
  };
}

interface TaskItemRowProps {
  task: Task;
  projectLabel: string;
  onClick: () => void;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-neutral-400",
};

function TaskItemRow({ task, projectLabel, onClick }: TaskItemRowProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  return (
    <div
      className="grid grid-cols-[8px_2fr_1fr_1fr_1fr] gap-3 items-center px-4 py-3 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-0"
      onClick={onClick}
    >
      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />

      {/* Title + project */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{task.title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{projectLabel}</p>
      </div>

      {/* Status chip */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.color}`} />
        <span className="text-xs font-medium text-neutral-600">{statusCfg.label}</span>
      </div>

      {/* Due date */}
      <span className="text-xs text-neutral-500">{task.dueDate}</span>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <span className="text-xs text-neutral-400 w-8 text-right flex-shrink-0">
          {task.progress}%
        </span>
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
  const { isManager } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>(isManager ? "created" : "assigned");
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allTasks: Array<{ task: Task; stageName: string; projectLabel: string }> =
    mockAllStages.flatMap((stage) =>
      stage.tasks.map((task) => ({
        task,
        stageName: stage.title,
        projectLabel: PROJECT_LABELS[stage.id] ?? "Unknown Project",
      }))
    );

  const getTabTasks = () => {
    switch (activeTab) {
      case "assigned":
        return allTasks.filter((t) => t.task.assignees.some((a) => a.id === currentUser.id));
      case "created":
        return allTasks.filter((t) => t.task.reporterId === currentUser.id);
      case "reviewing":
        return allTasks.filter(
          (t) => t.task.reporterId === currentUser.id && t.task.status === "IN_REVIEW"
        );
    }
  };

  const visibleTasks = getTabTasks();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(convertToTaskDetail(task));
    setIsModalOpen(true);
  };

  const handleTaskSave = (updated: TaskDetail) => {
    console.log("Task updated from My Tasks:", updated);
  };

  return (
    <div className="onfis-section">
      {/* Toolbar */}
      <div className="navbar-style">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Tasks</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            All your tasks across every project
          </p>
        </div>
      </div>

      {/* Tab bar + content */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 mt-3 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-neutral-200 px-4 pt-3">
          {(Object.keys(TAB_CONFIG) as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-neutral-500 border-transparent hover:text-neutral-800"
              }`}
            >
              {TAB_CONFIG[tab].label}
              {activeTab === tab && visibleTasks.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                  {visibleTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Column headers */}
        {visibleTasks.length > 0 && (
          <div className="grid grid-cols-[8px_2fr_1fr_1fr_1fr] gap-3 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
            <div />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Task</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Due</span>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Progress</span>
          </div>
        )}

        {/* Task list */}
        <div>
          {visibleTasks.length === 0 ? (
            <EmptyState
              icon={TAB_CONFIG[activeTab].emptyIcon}
              message={TAB_CONFIG[activeTab].emptyMsg}
            />
          ) : (
            visibleTasks.map(({ task, projectLabel }) => (
              <TaskItemRow
                key={task.id}
                task={task}
                projectLabel={projectLabel}
                onClick={() => handleTaskClick(task)}
              />
            ))
          )}
        </div>
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
