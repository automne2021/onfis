import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../components/common/Icons";

type ProjectStatus = "completed" | "in_progress" | "on_hold" | "planning";

interface Project {
  id: string;
  name: string;
  lastUpdate: string;
  status: ProjectStatus;
  progress: number;
}

interface ProjectTableProps {
  projects: Project[];
  itemsPerPage?: number;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; bgClass: string; textClass: string; progressClass: string }
> = {
  completed: {
    label: "Completed",
    bgClass: "bg-status-done/15",
    textClass: "text-status-done",
    progressClass: "bg-status-done",
  },
  in_progress: {
    label: "In progress",
    bgClass: "bg-status-on_track/15",
    textClass: "text-status-on_track",
    progressClass: "bg-status-on_track",
  },
  on_hold: {
    label: "On hold",
    bgClass: "bg-neutral-500/15",
    textClass: "text-neutral-500",
    progressClass: "bg-neutral-500",
  },
  planning: {
    label: "Planning",
    bgClass: "bg-neutral-500/15",
    textClass: "text-neutral-500",
    progressClass: "bg-neutral-500",
  },
};

export default function ProjectTable({ projects, itemsPerPage = 10 }: ProjectTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-[10px] shadow-sm border border-neutral-100">
      {/* Table Header */}
      <div className="bg-neutral-200 px-3 grid grid-cols-[2fr_1.5fr_1fr_1.5fr] gap-3 items-center">
        <div className="font-medium text-xs uppercase tracking-wider text-neutral-700 py-2">
          Project Name
        </div>
        <div className="font-medium text-xs uppercase tracking-wider text-neutral-700 py-2">
          Last Update
        </div>
        <div className="font-medium text-xs uppercase tracking-wider text-neutral-700 py-2">
          Status
        </div>
        <div className="font-medium text-xs uppercase tracking-wider text-neutral-700 py-2">
          Progress
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-white">
        {currentProjects.map((project) => {
          const config = statusConfig[project.status];

          return (
            <div
              key={project.id}
              className="px-3 py-2 h-10 grid grid-cols-[2fr_1.5fr_1fr_1.5fr] gap-3 items-center border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors"
            >
              {/* Project Name */}
              <div className="font-medium text-xs leading-4 text-black truncate">
                {project.name}
              </div>

              {/* Last Update */}
              <div className="font-normal text-xs leading-4 text-neutral-700">
                {project.lastUpdate}
              </div>

              {/* Status Badge */}
              <div>
                <span
                  className={`inline-flex items-center justify-center px-2 py-1 rounded-[12px] font-medium text-xs leading-4 ${config.bgClass} ${config.textClass}`}
                >
                  {config.label}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs leading-4 text-neutral-900 w-8">
                  {project.progress}%
                </span>
                <div className="flex-1 max-w-[120px] h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${config.progressClass}`}
                    style={{ width: `${Math.max(project.progress, 1)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination - only show if more than itemsPerPage */}
      {projects.length > itemsPerPage && (
        <div className="bg-neutral-50 border-t border-neutral-200 px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Showing {startIndex + 1}-{Math.min(endIndex, projects.length)} of {projects.length}
          </span>

          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-neutral-600"
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium transition-colors
                  ${currentPage === page
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-200"
                  }`}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-neutral-600"
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
