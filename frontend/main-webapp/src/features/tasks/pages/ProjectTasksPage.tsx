import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { TaskToolbar, TaskKanbanBoard, TaskListView, GanttView, TaskCalendarView, TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";

import CreateTaskModal from "../../projects/components/CreateTaskModal";
import type { Stage, ViewMode, Task } from "../types";
import type { TaskFormData } from "../../projects/components/CreateTaskModal";
import { getCurrentProjectUser } from "../../../services/projectService";
import { createTask, listProjectTasks, reviewTask, updateTask, type ApiTask } from "../../../services/taskService";
import { useToast } from "../../../contexts/useToast";

const STAGE_BY_STATUS: Record<Task["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const toTaskView = (task: ApiTask): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  priority: task.priority,
  status: task.status,
  progress: task.progress,
  dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
  assignees: task.assignees,
  reporterId: task.reporterId,
  estimatedEffort: task.estimatedEffort,
  actualEffort: task.actualEffort,
  blockedBy: task.blockedBy,
  tags: [],
});

const toStageList = (tasks: Task[]): Stage[] => {
  const byStatus: Record<Task["status"], Task[]> = {
    TODO: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    IN_REVIEW: [],
    DONE: [],
  };
  tasks.forEach((task) => {
    byStatus[task.status].push(task);
  });
  return Object.entries(STAGE_BY_STATUS).map(([status, title]) => ({
    id: status,
    title,
    tasks: byStatus[status as Task["status"]],
  }));
};

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

export default function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [stages, setStages] = useState<Stage[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const projectName = "Project Tasks";

  const allTasks = useMemo(() => stages.flatMap((stage) => stage.tasks), [stages]);

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const [tasks, me] = await Promise.all([listProjectTasks(projectId), getCurrentProjectUser()]);
        const mappedTasks = tasks.map(toTaskView);
        setStages(toStageList(mappedTasks));
        setCanManage(me.permissions.includes("PROJECT_MANAGE"));
      } catch {
        showToast("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [projectId, showToast]);

  // Convert basic Task to TaskDetail for modal
  const convertToTaskDetail = (task: Task): TaskDetail => ({
    ...task,
    subTasks: [
      { id: "st-1", title: "Research available OAuth 2.0 libraries for Node.js", completed: true },
      { id: "st-2", title: "Configure API credentials in Google Cloud Console", completed: false },
      { id: "st-3", title: "Implement callback route handler", completed: false },
    ],
    activities: [
      {
        id: "act-1",
        user: "Sarah Jenkins",
        action: "changed status to",
        value: task.status,
        timestamp: "10 mins ago",
      },
    ],
    comments: [
      {
        id: "cmt-1",
        user: { id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
        content: "Let's prioritize the Google SSO implementation first.",
        timestamp: "2 hours ago",
      },
    ],
    createdAt: "Oct 20, 2023 9:41 AM",
    updatedAt: "4 hours ago",
    key: "DEV-162",
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(convertToTaskDetail(task));
    setIsModalOpen(true);
  };

  const handleTaskSave = (updatedTask: TaskDetail) => {
    const run = async () => {
      try {
        await updateTask(updatedTask.id, {
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: toApiPriority(updatedTask.priority),
          progress: updatedTask.progress,
          dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString().slice(0, 10) : undefined,
          reporterId: updatedTask.reporterId,
          estimatedEffort: updatedTask.estimatedEffort,
          actualEffort: updatedTask.actualEffort,
          assigneeIds: updatedTask.assignees.map((a) => a.id),
          tags: "[]",
        });

        if (updatedTask.reviews && updatedTask.reviews.length > 0) {
          const latest = updatedTask.reviews[updatedTask.reviews.length - 1];
          if (latest.action === "approved" || latest.action === "changes_requested") {
            await reviewTask(updatedTask.id, {
              action: latest.action === "approved" ? "APPROVED" : "CHANGES_REQUESTED",
              content: latest.content,
            });
          }
        }

        if (projectId) {
          const refreshed = await listProjectTasks(projectId);
          setStages(toStageList(refreshed.map(toTaskView)));
        }
      } catch {
        showToast("Unable to update task", "error");
      }
    };

    void run();
  };

  const handleAddStage = () => {
    showToast("Workflow stage management will be enabled in next API iteration", "info");
  };

  const handleAddTask = (stageId: string) => {
    setSelectedStageId(stageId);
    setIsCreateTaskModalOpen(true);
  };

  return (
    <div className="onfis-section">
      {/* Toolbar */}
      <TaskToolbar
        projectTitle={projectName}
        projectId={projectId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTask={() => setIsCreateTaskModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area with view switch animation */}
      <div className="flex-1 overflow-hidden">
        <div key={viewMode} className="animate-viewSwitch h-full">
          {loading && <div className="px-4 py-4 text-sm text-neutral-500">Loading tasks...</div>}
          {!loading && (
            <>
          {viewMode === "kanban" && (
            <TaskKanbanBoard
              stages={toStageList(allTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase())))}
              onAddStage={canManage ? handleAddStage : undefined}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
            />
          )}

          {viewMode === "list" && (
            <TaskListView
              stages={toStageList(allTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase())))}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
            />
          )}

          {viewMode === "timeline" && (
            <GanttView />
          )}

          {viewMode === "calendar" && (
            <TaskCalendarView
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
            </>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleTaskSave}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setSelectedStageId(null);
        }}
        onSubmit={(data) => {
          const submit = async (formData: TaskFormData) => {
            if (!projectId) return;
            try {
              const status = selectedStageId && selectedStageId in STAGE_BY_STATUS
                ? selectedStageId as Task["status"]
                : "TODO";
              await createTask(projectId, {
                title: formData.name,
                description: formData.description,
                status,
                priority: toApiPriority(formData.priority),
                progress: 0,
                dueDate: formData.endDate ? formData.endDate.toISOString().slice(0, 10) : undefined,
                reporterId: formData.reporterId || undefined,
                estimatedEffort: formData.estimatedEffort,
                assigneeIds: formData.assigneeId ? [formData.assigneeId] : [],
                tags: "[]",
              });
              const refreshed = await listProjectTasks(projectId);
              setStages(toStageList(refreshed.map(toTaskView)));
              showToast("Task created", "success");
            } catch {
              showToast("Unable to create task", "error");
            }
          };

          void submit(data);
          setIsCreateTaskModalOpen(false);
          setSelectedStageId(null);
        }}
      />
    </div>
  );
}
