import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectToolbar from "../components/ProjectToolbar";
import KanbanBoard from "../components/KanbanBoard";
import CreateProjectModal from "../components/CreateProjectModal";
import { ProjectListView } from "../components/list";
import { ProjectTimelineView } from "../components/timeline";
import { ProjectCalendarView } from "../components/calendar";
import type { Project } from "../types";
import { useRole } from "../../../hooks/useRole";
import { useAuth } from "../../../contexts/AuthContext";

// Mock data - replace with real API data
const mockProjects: Project[] = [
  {
    id: "1",
    title: "Server Migration",
    description: "Moving bla bla (2 lines) ..............................................................................",
    tags: [{ label: "DevOps", type: "department" }],
    priority: "low",
    progress: 0,
    dueDate: "Oct 1, 2025",
    status: "planning",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
  {
    id: "2",
    title: "Server Migration",
    description: "Moving bla bla...",
    tags: [{ label: "DevOps", type: "department" }],
    priority: "low",
    progress: 0,
    dueDate: "Oct 1, 2025",
    status: "planning",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
  {
    id: "3",
    title: "Server Migration",
    description: "Moving bla bla (2 lines) ..............................................................................",
    tags: [{ label: "Internal", type: "scope" }],
    priority: "high",
    progress: 15,
    dueDate: "Oct 1, 2025",
    status: "in_progress",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
  {
    id: "4",
    title: "Server Migration",
    description: "Moving bla bla...",
    tags: [{ label: "Internal", type: "scope" }],
    priority: "medium",
    progress: 15,
    dueDate: "Oct 1, 2025",
    status: "in_progress",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
  {
    id: "5",
    title: "Server Migration",
    description: "Moving bla bla...",
    tags: [{ label: "Internal", type: "scope" }],
    priority: "medium",
    progress: 15,
    dueDate: "Oct 1, 2025",
    status: "in_progress",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
  {
    id: "6",
    title: "Server Migration",
    description: "Moving bla bla...",
    tags: [
      { label: "R&D", type: "department" },
      { label: "Internal", type: "scope" },
    ],
    priority: "low",
    progress: 60,
    dueDate: "Oct 1, 2025",
    status: "on_hold",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
  {
    id: "7",
    title: "Server Migration",
    description: "Moving bla bla...",
    tags: [{ label: "Internal", type: "scope" }],
    priority: "low",
    progress: 100,
    dueDate: "Oct 1, 2025",
    status: "completed",
    assignees: [
      { id: "1", name: "User 1", avatar: "" },
      { id: "2", name: "User 2", avatar: "" },
    ],
  },
];

type ViewMode = "kanban" | "list" | "timeline" | "calendar";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { isManager } = useRole();
  const { currentUser } = useAuth();

  // Filter projects by search query
  const baseProjects = isManager
    ? projects
    : projects.filter((p) => p.assignees.some((a) => a.id === currentUser.id));

  const filteredProjects = baseProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group projects by status for Kanban view
  const projectsByStatus = {
    planning: filteredProjects.filter((p) => p.status === "planning"),
    in_progress: filteredProjects.filter((p) => p.status === "in_progress"),
    on_hold: filteredProjects.filter((p) => p.status === "on_hold"),
    completed: filteredProjects.filter((p) => p.status === "completed"),
  };

  const handleNewProject = () => {
    setIsCreateModalOpen(true);
  };



  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}/tasks`);
  };

  return (
    <div className="onfis-section">
      {/* Toolbar */}
      <ProjectToolbar
        onNewProject={isManager ? handleNewProject : undefined}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content with view switch animation */}
      <div className="flex-1 overflow-hidden px-3 pb-3">
        <div key={viewMode} className="animate-viewSwitch h-full">
          {viewMode === "kanban" && (
            <KanbanBoard projectsByStatus={projectsByStatus} onProjectClick={handleProjectClick} />
          )}
          {viewMode === "list" && (
            <ProjectListView projects={filteredProjects} onProjectClick={handleProjectClick} />
          )}
          {viewMode === "timeline" && (
            <ProjectTimelineView projects={filteredProjects} onProjectClick={handleProjectClick} />
          )}
          {viewMode === "calendar" && (
            <ProjectCalendarView projects={filteredProjects} onProjectClick={handleProjectClick} />
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          console.log("Create project:", data);
          // TODO: Implement API call to create project
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
