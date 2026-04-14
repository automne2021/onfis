import { useState, useMemo } from "react";
import type { Project } from "../../types";
import ProjectListHeader from "./ProjectListHeader";
import ProjectListRow from "./ProjectListRow";
import type { ProjectListColumn, SortConfig } from "./types";

interface ProjectListViewProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

const columns: ProjectListColumn[] = [
  { key: "title", label: "Project", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "progress", label: "Progress", sortable: true },
  { key: "assignees", label: "Team", sortable: false },
  { key: "dueDate", label: "Due Date", sortable: true },
  { key: "priority", label: "Priority", sortable: true },
  { key: "actions", label: "", sortable: false },
];

export default function ProjectListView({ projects, onProjectClick }: ProjectListViewProps) {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!sortConfig.key) return projects;

    return [...projects].sort((a, b) => {
      const key = sortConfig.key as keyof Project;
      let aValue = a[key];
      let bValue = b[key];

      // Handle special cases
      if (key === "progress") {
        aValue = a.progress;
        bValue = b.progress;
      } else if (key === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      } else if (key === "status") {
        const statusOrder = { planning: 0, in_progress: 1, on_hold: 2, completed: 3 };
        aValue = statusOrder[a.status];
        bValue = statusOrder[b.status];
      }

      if (aValue == null || bValue == null) return 0;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [projects, sortConfig]);

  const handleSort = (key: ProjectListColumn["key"]) => {
    if (key === "actions" || key === "assignees") return;

    setSortConfig((prev) => ({
      key: key as keyof Project,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map((p) => p.id)));
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <ProjectListHeader
        columns={columns}
        sortConfig={sortConfig}
        onSort={handleSort}
        allSelected={selectedProjects.size === projects.length && projects.length > 0}
        onSelectAll={handleSelectAll}
      />

      {/* Project Rows */}
      <div className="flex-1 overflow-y-auto">
        {sortedProjects.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-400">
            No projects found
          </div>
        ) : (
          sortedProjects.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              isSelected={selectedProjects.has(project.id)}
              onSelect={() => handleSelectProject(project.id)}
              onClick={() => onProjectClick?.(project)}
            />
          ))
        )}
      </div>

      {/* Selection Summary */}
      {selectedProjects.size > 0 && (
        <div className="px-3 py-2 bg-primary/5 border-t border-primary/20 flex items-center justify-between">
          <span className="text-sm text-primary font-medium">
            {selectedProjects.size} project{selectedProjects.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              Bulk Actions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
