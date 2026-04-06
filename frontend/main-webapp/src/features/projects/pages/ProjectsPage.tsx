import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectToolbar from "../components/ProjectToolbar";
import type { ActiveFilters } from "../../../components/common/FilterDropdown";
import KanbanBoard from "../components/KanbanBoard";
import CreateProjectModal from "../components/CreateProjectModal";
import { ProjectListView } from "../components/list";
import { ProjectTimelineView } from "../components/timeline";
import { ProjectCalendarView } from "../components/calendar";
import type { Project } from "../types";
import type { ProjectFormData } from "../components/CreateProjectModal";
import { createMilestone, createProject, getCurrentProjectUser, listCompanyTags, listProjects, searchProjectUsers, type ApiUserSummary } from "../../../services/projectService";
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
  slug: apiProject.slug,
  title: apiProject.title,
  description: apiProject.description || "",
  tags: parseTagJson(apiProject.tags || "[]"),
  priority: apiProject.priority,
  progress: apiProject.progress,
  dueDate: apiProject.dueDate ? new Date(apiProject.dueDate).toLocaleDateString() : "",
  status: apiProject.status,
  assignees: apiProject.assignees,
});

function ProjectsLoadingSkeleton() {
  return (
    <div className="px-3 py-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm animate-pulse">
            <div className="h-4 w-24 rounded bg-neutral-200" />
            <div className="h-3 w-3/4 rounded bg-neutral-100 mt-2" />
            <div className="h-3 w-1/2 rounded bg-neutral-100 mt-1.5" />
            <div className="h-2 w-full rounded bg-neutral-100 mt-4" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-white p-3 shadow-sm space-y-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 rounded-lg bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { withTenant } = useTenantPath();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [managerOptions, setManagerOptions] = useState<ApiUserSummary[]>([]);
  const [companyTags, setCompanyTags] = useState<string[]>([]);
  const [canCreateProject, setCanCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [apiProjects, me, users] = await Promise.all([
          listProjects(),
          getCurrentProjectUser(),
          searchProjectUsers(""),
        ]);
        const sharedTags = await listCompanyTags();
        setProjects(apiProjects.map(toProjectViewModel));
        setCanCreateProject(me.permissions.includes("PROJECT_CREATE"));
        setManagerOptions(users);
        setCompanyTags(sharedTags.map((tag) => tag.name));
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
    (project) => {
      const query = searchQuery.trim().toLowerCase();
      if (query && !project.title.toLowerCase().includes(query) && !project.description.toLowerCase().includes(query)) {
        return false;
      }

      const statusFilters = activeFilters.status ?? [];
      if (statusFilters.length > 0 && !statusFilters.includes(project.status)) {
        return false;
      }

      const priorityFilters = activeFilters.priority ?? [];
      if (priorityFilters.length > 0 && !priorityFilters.includes(project.priority)) {
        return false;
      }

      return true;
    }
  ), [projects, searchQuery, activeFilters]);

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
    navigate(withTenant(`/projects/${project.slug}/tasks`));
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      const serializedTags = JSON.stringify(
        data.tags.map((label) => ({ label, type: "scope" as const })),
      );

      const created = await createProject({
        title: data.name,
        description: data.description,
        status: "PLANNING",
        priority: "MEDIUM",
        progress: 0,
        startDate: data.startDate ? data.startDate.toISOString().slice(0, 10) : undefined,
        dueDate: data.endDate ? data.endDate.toISOString().slice(0, 10) : undefined,
        tags: serializedTags,
        managerId: data.managerId || undefined,
        customer: data.customer || undefined,
      });

      const milestoneInputs = data.milestones
        .map((milestone) => ({
          title: milestone.name.trim(),
          targetDate: milestone.targetDate.trim(),
        }))
        .filter((milestone) => milestone.title && milestone.targetDate);

      const failedMilestones: string[] = [];
      for (const [index, milestone] of milestoneInputs.entries()) {
        try {
          await createMilestone(created.id, {
            title: milestone.title,
            targetDate: milestone.targetDate,
            status: "upcoming",
            sortOrder: index + 1,
          });
        } catch {
          failedMilestones.push(milestone.title);
        }
      }

      setProjects((prev) => [toProjectViewModel(created), ...prev]);

      if (failedMilestones.length > 0) {
        showToast(
          `Project created, but ${failedMilestones.length} milestone(s) failed to save.`,
          "warning",
        );
      } else {
        showToast("Project created successfully", "success");
      }
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
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content with view switch animation */}
      <div className="flex-1 overflow-hidden px-3 pb-3">
        {loading && <ProjectsLoadingSkeleton />}
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
            <ProjectTimelineView
              projects={filteredProjects}
              onProjectClick={handleProjectClick}
              currentDate={currentViewDate}
              onCurrentDateChange={setCurrentViewDate}
            />
          )}
          {viewMode === "calendar" && (
            <ProjectCalendarView
              projects={filteredProjects}
              onProjectClick={handleProjectClick}
              currentDate={currentViewDate}
              onCurrentDateChange={setCurrentViewDate}
            />
          )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        managers={managerOptions}
        availableTags={companyTags}
        onSubmit={(data) => {
          void handleCreateProject(data);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
