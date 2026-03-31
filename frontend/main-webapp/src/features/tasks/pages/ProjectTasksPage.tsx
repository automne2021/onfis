import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { TaskToolbar, TaskKanbanBoard, TaskListView, GanttView, TaskCalendarView, TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";

import CreateTaskModal from "../../projects/components/CreateTaskModal";
import type { Stage, ViewMode, Task } from "../types";
import type { TaskFormData } from "../../projects/components/CreateTaskModal";
import { getCurrentProjectUser, createProjectStage, updateProjectStage, deleteProjectStage, getProjectMembers, getProject } from "../../../services/projectService";
import { createTask, listProjectTasks, reviewTask, updateTask, getTaskDetail, type ApiTask } from "../../../services/taskService";
import { useToast } from "../../../contexts/useToast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

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
  const { projectId: projectIdentifier } = useParams<{ projectId: string }>();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [stages, setStages] = useState<Stage[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("Project Tasks");
  const [taskUsers, setTaskUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);

  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageDeleteId, setStageDeleteId] = useState<string | null>(null);

  const allTasks = useMemo(() => stages.flatMap((stage) => stage.tasks), [stages]);

  useEffect(() => {
    const load = async () => {
      if (!projectIdentifier) return;
      try {
        setLoading(true);
        const [tasks, me, members, project] = await Promise.all([
          listProjectTasks(projectIdentifier),
          getCurrentProjectUser(),
          getProjectMembers(projectIdentifier),
          getProject(projectIdentifier),
        ]);
        const mappedTasks = tasks.map(toTaskView);
        setStages(toStageList(mappedTasks));
        setCanManage(me.permissions.includes("PROJECT_MANAGE"));
        setTaskUsers(members.map((member) => ({ id: member.id, name: member.name, avatar: member.avatar })));
        setProjectName(project.title || "Project Tasks");
      } catch {
        showToast("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [projectIdentifier, showToast]);

  const handleTaskClick = (task: Task) => {
    const loadDetail = async () => {
      try {
        const detail = await getTaskDetail(task.id);
        const taskDetail: TaskDetail = {
          ...task,
          subTasks: (detail.subtasks || []).map((st) => ({
            id: st.id,
            title: st.title,
            completed: st.completed,
          })),
          activities: (detail.activities || []).map((a) => ({
            id: a.id,
            user: a.actorName,
            action: a.action,
            value: a.value ?? undefined,
            timestamp: a.createdAt,
          })),
          comments: (detail.comments || []).map((c) => ({
            id: c.id,
            user: { id: c.authorId, name: c.authorName, avatar: c.authorAvatar },
            content: c.content,
            timestamp: c.createdAt,
          })),
          createdAt: "",
          updatedAt: "",
          key: detail.key || `TASK-${task.id.slice(0, 6)}`,
        };
        setSelectedTask(taskDetail);
        setIsModalOpen(true);
      } catch {
        // Fallback: open modal with minimal data
        setSelectedTask({
          ...task,
          subTasks: [],
          activities: [],
          comments: [],
          createdAt: "",
          updatedAt: "",
          key: `TASK-${task.id.slice(0, 6)}`,
        });
        setIsModalOpen(true);
        showToast("Could not load full task details", "warning");
      }
    };
    void loadDetail();
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

        if (projectIdentifier) {
          const refreshed = await listProjectTasks(projectIdentifier);
          setStages(toStageList(refreshed.map(toTaskView)));
        }
      } catch {
        showToast("Unable to update task", "error");
      }
    };

    void run();
  };

  const handleAddStage = async () => {
    if (!projectIdentifier) return;
    const name = prompt("Enter stage name:");
    if (!name?.trim()) return;
    try {
      await createProjectStage(projectIdentifier, { name: name.trim() });
      const refreshed = await listProjectTasks(projectIdentifier);
      setStages(toStageList(refreshed.map(toTaskView)));
      showToast("Stage created", "success");
    } catch {
      showToast("Unable to create stage", "error");
    }
  };

  const handleRenameStage = async (stageId: string, currentName: string) => {
    if (!projectIdentifier) return;
    const newName = prompt("Rename stage:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;
    try {
      await updateProjectStage(projectIdentifier, stageId, { name: newName.trim() });
      showToast("Stage renamed", "success");
    } catch {
      showToast("Unable to rename stage", "error");
    }
  };

  const handleDeleteStageConfirmed = async () => {
    if (!projectIdentifier || !stageDeleteId) return;
    setStageDeleteId(null);
    try {
      await deleteProjectStage(projectIdentifier, stageDeleteId);
      const refreshed = await listProjectTasks(projectIdentifier);
      setStages(toStageList(refreshed.map(toTaskView)));
      showToast("Stage deleted", "success");
    } catch {
      showToast("Unable to delete stage", "error");
    }
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
        projectId={projectIdentifier}
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
              onAddStage={canManage ? (() => void handleAddStage()) : undefined}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
              onDeleteStage={canManage ? ((stageId) => setStageDeleteId(stageId)) : undefined}
              onRenameStage={canManage ? ((stageId, currentName) => void handleRenameStage(stageId, currentName)) : undefined}
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
        users={taskUsers}
        projects={projectIdentifier ? [{ id: projectIdentifier, name: projectName }] : []}
        defaultProjectId={projectIdentifier}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setSelectedStageId(null);
        }}
        onSubmit={(data) => {
          const submit = async (formData: TaskFormData) => {
            if (!projectIdentifier) return;
            try {
              const status = selectedStageId && selectedStageId in STAGE_BY_STATUS
                ? selectedStageId as Task["status"]
                : "TODO";
              await createTask(projectIdentifier, {
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
              const refreshed = await listProjectTasks(projectIdentifier);
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

      {/* Confirm dialog for stage deletion */}
      <ConfirmDialog
        isOpen={!!stageDeleteId}
        title="Delete Workflow Stage"
        message="Are you sure you want to delete this workflow stage? Tasks in this stage will be unassigned. This action cannot be undone."
        confirmLabel="Delete Stage"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void handleDeleteStageConfirmed()}
        onCancel={() => setStageDeleteId(null)}
      />
    </div>
  );
}
