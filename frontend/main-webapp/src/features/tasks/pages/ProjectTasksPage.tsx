import { useState } from "react";
import { useParams } from "react-router-dom";
import { TaskToolbar, TaskKanbanBoard, TaskListView, GanttView, TaskCalendarView, TaskDetailModal } from "../components";
import type { TaskDetail } from "../components";

import CreateTaskModal from "../../projects/components/CreateTaskModal";
import type { Stage, ViewMode, Task } from "../types";

// Mock data — now includes status, reporterId, estimatedEffort, actualEffort, blockedBy
const mockStages: Stage[] = [
  {
    id: "stage-1",
    title: "Stage 1",
    tasks: [
      {
        id: "task-1",
        title: "Design",
        description: "Create UI/UX design for the website",
        priority: "medium",
        status: "IN_PROGRESS",
        progress: 75,
        dueDate: "Oct 1, 2026",
        assignees: [
          { id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
          { id: "2", name: "Bob" },
        ],
        reporterId: "3",
        estimatedEffort: 16,
        actualEffort: 12,
        tags: [
          { id: "tag-1", type: "department", label: "DevOps" },
          { id: "tag-2", type: "scope", label: "Internal" },
        ],
      },
      {
        id: "task-2",
        title: "Design System",
        description: "Design system components",
        priority: "medium",
        status: "IN_REVIEW",
        progress: 100,
        dueDate: "Oct 1, 2026",
        assignees: [
          { id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
        ],
        reporterId: "2",
        estimatedEffort: 8,
        actualEffort: 10,
        tags: [
          { id: "tag-3", type: "department", label: "DevOps" },
          { id: "tag-4", type: "scope", label: "Internal" },
        ],
      },
    ],
  },
  {
    id: "stage-2",
    title: "Stage 2",
    tasks: [
      {
        id: "task-3",
        title: "Development",
        description: "Frontend implementation",
        priority: "high",
        status: "TODO",
        progress: 0,
        dueDate: "Oct 15, 2026",
        assignees: [
          { id: "4", name: "David" },
        ],
        reporterId: "1",
        estimatedEffort: 40,
        actualEffort: 0,
        tags: [
          { id: "tag-5", type: "department", label: "Frontend" },
        ],
      },
      {
        id: "task-4",
        title: "Testing",
        description: "QA and testing phase",
        priority: "low",
        status: "BLOCKED",
        progress: 0,
        dueDate: "Nov 1, 2026",
        assignees: [],
        reporterId: "1",
        estimatedEffort: 20,
        actualEffort: 0,
        blockedBy: ["task-3"],
        tags: [
          { id: "tag-6", type: "scope", label: "QA" },
        ],
      },
    ],
  },
];

export default function ProjectTasksPage() {
  const { projectId: _projectId } = useParams<{ projectId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [stages, setStages] = useState<Stage[]>(mockStages);

  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Project name would come from API based on projectId
  const projectName = "ABC Website";

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
    // Update the task in stages
    const updatedStages = stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.map((t) =>
        t.id === updatedTask.id
          ? {
            ...t,
            title: updatedTask.title,
            description: updatedTask.description,
            priority: updatedTask.priority,
            status: updatedTask.status,
            progress: updatedTask.progress,
            dueDate: updatedTask.dueDate,
            assignees: updatedTask.assignees,
            reporterId: updatedTask.reporterId,
            estimatedEffort: updatedTask.estimatedEffort,
            actualEffort: updatedTask.actualEffort,
            blockedBy: updatedTask.blockedBy,
          }
          : t
      ),
    }));
    setStages(updatedStages);
    console.log("Task saved:", updatedTask);
  };

  const handleAddStage = () => {
    const newStage: Stage = {
      id: `stage-${stages.length + 1}`,
      title: `Stage ${stages.length + 1}`,
      tasks: [],
    };
    setStages([...stages, newStage]);
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
        projectId={_projectId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTask={() => setIsCreateTaskModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" && (
          <TaskKanbanBoard
            stages={stages}
            onAddStage={handleAddStage}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
          />
        )}

        {viewMode === "list" && (
          <TaskListView
            stages={stages}
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
          console.log("Create task:", data, "in stage:", selectedStageId);
          setIsCreateTaskModalOpen(false);
          setSelectedStageId(null);
        }}
      />
    </div>
  );
}
