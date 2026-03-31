import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { TaskToolbar, TaskKanbanBoard, TaskListView, GanttView, TaskCalendarView, TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";
import type { ActiveFilters } from "../../../components/common/FilterDropdown";
import type { GanttTask } from "../components/gantt/types";

import CreateTaskModal from "../../projects/components/CreateTaskModal";
import type { Stage, ViewMode, Task } from "../types";
import type { TaskFormData } from "../../projects/components/CreateTaskModal";
import { getCurrentProjectUser, createProjectStage, updateProjectStage, deleteProjectStage, getProjectMembers, getProject, listCompanyTags } from "../../../services/projectService";
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

const parseTaskTags = (raw?: string | null): Task["tags"] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<string | { id?: string; label?: string; type?: string; name?: string }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item, index) => {
        if (typeof item === "string") {
          const label = item.trim();
          if (!label) {
            return null;
          }
          return {
            id: `tag-${index}-${label.toLowerCase().replace(/\s+/g, "-")}`,
            label,
            type: "scope" as const,
          };
        }

        const label = (item.label ?? item.name ?? "").trim();
        if (!label) {
          return null;
        }

        return {
          id: item.id ?? `tag-${index}-${label.toLowerCase().replace(/\s+/g, "-")}`,
          label,
          type: item.type === "department" ? ("department" as const) : ("scope" as const),
        };
      })
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null);
  } catch {
    return [];
  }
};

const serializeTaskTags = (tags?: Task["tags"]): string => {
  const normalized = (tags ?? [])
    .filter((tag) => tag.label.trim() !== "")
    .map((tag) => ({
      label: tag.label.trim(),
      type: tag.type ?? "scope",
    }));
  return JSON.stringify(normalized);
};

const toTaskView = (task: ApiTask): Task => ({
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
  reporterId: task.reporterId,
  reporterName: task.reporterName,
  estimatedEffort: task.estimatedEffort,
  actualEffort: task.actualEffort,
  blockedBy: task.blockedBy,
  tags: parseTaskTags(task.tags),
});

const toDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const TASK_TO_GANTT_STATUS: Record<Task["status"], GanttTask["status"]> = {
  TODO: "to_do",
  IN_PROGRESS: "in_progress",
  BLOCKED: "review",
  IN_REVIEW: "review",
  DONE: "done",
};

const toGanttTask = (task: Task, defaultProjectName: string): GanttTask => {
  const startDate = toDate(task.startDateRaw) ?? toDate(task.dueDateRaw) ?? new Date();
  const fallbackEnd = new Date(startDate);
  fallbackEnd.setDate(fallbackEnd.getDate() + 3);
  const dueDate = toDate(task.dueDateRaw) ?? fallbackEnd;
  const endDate = dueDate >= startDate ? dueDate : startDate;

  return {
    id: task.id,
    taskKey: task.key,
    name: task.title,
    owner: task.assignees[0] ?? { id: "unassigned", name: "Unassigned" },
    status: TASK_TO_GANTT_STATUS[task.status],
    startDate,
    endDate,
    priority: task.priority,
    projectName: task.projectTitle || defaultProjectName,
    description: task.description,
  };
};

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

function TasksLoadingSkeleton() {
  return (
    <div className="px-4 py-3 space-y-3 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm">
            <div className="h-4 w-2/3 rounded bg-neutral-200" />
            <div className="h-3 w-1/2 rounded bg-neutral-100 mt-2" />
            <div className="h-2 w-full rounded bg-neutral-100 mt-4" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-white p-3 shadow-sm space-y-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-9 rounded-lg bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectTasksPage() {
  const { projectId: projectIdentifier } = useParams<{ projectId: string }>();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [stages, setStages] = useState<Stage[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("Project Tasks");
  const [taskUsers, setTaskUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [companyTags, setCompanyTags] = useState<string[]>([]);

  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageDeleteId, setStageDeleteId] = useState<string | null>(null);

  const allTasks = useMemo(() => stages.flatMap((stage) => stage.tasks), [stages]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const inTitle = task.title.toLowerCase().includes(query);
        const inDescription = task.description.toLowerCase().includes(query);
        if (!inTitle && !inDescription) {
          return false;
        }
      }

      const statusFilters = activeFilters.status ?? [];
      if (statusFilters.length > 0 && !statusFilters.includes(task.status)) {
        return false;
      }

      const priorityFilters = activeFilters.priority ?? [];
      if (priorityFilters.length > 0 && !priorityFilters.includes(task.priority)) {
        return false;
      }

      const assigneeFilters = activeFilters.assignee ?? [];
      if (assigneeFilters.length > 0) {
        const matchedAssignee = task.assignees.some((assignee) => assigneeFilters.includes(assignee.id));
        if (!matchedAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [allTasks, searchQuery, activeFilters]);

  const filteredStages = useMemo(() => toStageList(filteredTasks), [filteredTasks]);
  const ganttTasks = useMemo(() => filteredTasks.map((task) => toGanttTask(task, projectName)), [filteredTasks, projectName]);

  useEffect(() => {
    const load = async () => {
      if (!projectIdentifier) return;
      try {
        setLoading(true);
        const [tasks, me, members, project, sharedTags] = await Promise.all([
          listProjectTasks(projectIdentifier),
          getCurrentProjectUser(),
          getProjectMembers(projectIdentifier),
          getProject(projectIdentifier),
          listCompanyTags(),
        ]);
        const mappedTasks = tasks.map(toTaskView);
        setStages(toStageList(mappedTasks));
        setCanManage(me.permissions.includes("PROJECT_MANAGE"));
        setTaskUsers(members.map((member) => ({ id: member.id, name: member.name, avatar: member.avatar })));
        setProjectName(project.title || "Project Tasks");
        setCompanyTags(sharedTags.map((tag) => tag.name));
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
            description: a.description,
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
          reporterName: detail.reporterName,
          key: detail.key || task.key || "TASK-000",
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
          key: task.key || "TASK-000",
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
          tags: serializeTaskTags(updatedTask.tags),
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
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        assigneeOptions={taskUsers.map((user) => ({ value: user.id, label: user.name }))}
        onNewTask={() => setIsCreateTaskModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area with view switch animation */}
      <div className="flex-1 overflow-hidden">
        <div key={viewMode} className="animate-viewSwitch h-full">
          {loading && <TasksLoadingSkeleton />}
          {!loading && (
            <>
          {viewMode === "kanban" && (
            <TaskKanbanBoard
              stages={filteredStages}
              onAddStage={canManage ? (() => void handleAddStage()) : undefined}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
              onDeleteStage={canManage ? ((stageId) => setStageDeleteId(stageId)) : undefined}
              onRenameStage={canManage ? ((stageId, currentName) => void handleRenameStage(stageId, currentName)) : undefined}
            />
          )}

          {viewMode === "list" && (
            <TaskListView
              stages={filteredStages}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
            />
          )}

          {viewMode === "timeline" && (
            <GanttView tasks={ganttTasks} />
          )}

          {viewMode === "calendar" && (
            <TaskCalendarView
              tasks={filteredTasks}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
            </>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
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
        availableTags={companyTags}
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
                tags: JSON.stringify(formData.tags.map((label) => ({ label, type: "scope" as const }))),
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
