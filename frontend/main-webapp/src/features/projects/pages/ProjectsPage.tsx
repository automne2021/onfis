import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectToolbar from "../components/ProjectToolbar";
import KanbanBoard from "../components/KanbanBoard";
import CreateProjectModal from "../components/CreateProjectModal";
import { ProjectListView } from "../components/list";
import { ProjectTimelineView } from "../components/timeline";
import { ProjectCalendarView } from "../components/calendar";
import type { Project } from "../types";
import type { ProjectFormData } from "../components/CreateProjectModal";
import { createProject, getCurrentProjectUser, listProjects } from "../../../services/projectService";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { useToast } from "../../../contexts/useToast";

type ViewMode = "kanban" | "list" | "timeline" | "calendar";

const parseTagJson = (raw: string): Project["tags"] => {
  try {
    const data = JSON.parse(raw) as Array<{ label: string; type: "department" | "scope" }>;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const toProjectViewModel = (apiProject: Awaited<ReturnType<typeof listProjects>>[number]): Project => ({
  id: apiProject.id,
  title: apiProject.title,
  description: apiProject.description || "",
  tags: parseTagJson(apiProject.tags || "[]"),
  priority: apiProject.priority,
  progress: apiProject.progress,
  dueDate: apiProject.dueDate ? new Date(apiProject.dueDate).toLocaleDateString() : "",
  status: apiProject.status,
  assignees: apiProject.assignees,
});

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { withTenant } = useTenantPath();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [canCreateProject, setCanCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [apiProjects, me] = await Promise.all([listProjects(), getCurrentProjectUser()]);
        setProjects(apiProjects.map(toProjectViewModel));
        setCanCreateProject(me.permissions.includes("PROJECT_CREATE"));
      } catch {
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // Filter projects by search query
  const filteredProjects = useMemo(() => projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  ), [projects, searchQuery]);

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
    navigate(withTenant(`/projects/${project.id}/tasks`));
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      const created = await createProject({
        title: data.name,
        description: data.description,
        status: "PLANNING",
        priority: "MEDIUM",
        progress: 0,
        startDate: data.startDate ? data.startDate.toISOString().slice(0, 10) : undefined,
        dueDate: data.endDate ? data.endDate.toISOString().slice(0, 10) : undefined,
        tags: "[]",
      });
      setProjects((prev) => [toProjectViewModel(created), ...prev]);
      showToast("Project created successfully", "success");
    } catch {
      showToast("Unable to create project", "error");
    }
  };

  return (
    <div className="onfis-section">
      {/* Toolbar */}
      <ProjectToolbar
        onNewProject={canCreateProject ? handleNewProject : undefined}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content with view switch animation */}
      <div className="flex-1 overflow-hidden px-3 pb-3">
        {loading && <div className="text-sm text-neutral-500 px-3 py-4">Loading projects...</div>}
        {error && !loading && <div className="text-sm text-red-500 px-3 py-4">{error}</div>}
        {!loading && !error && (
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
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          void handleCreateProject(data);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
