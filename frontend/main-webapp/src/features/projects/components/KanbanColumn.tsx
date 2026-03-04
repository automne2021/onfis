import { useState, useRef, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import type { Project, ProjectStatus } from "../types";
import { MoreVertIcon, SortColumnIcon as SortIcon } from "../../../components/common/Icons";

interface KanbanColumnProps {
  title: string;
  projects: Project[];
  status: ProjectStatus;
  onProjectClick?: (project: Project) => void;
}

export default function KanbanColumn({ title, projects, onProjectClick }: KanbanColumnProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortedProjects, setSortedProjects] = useState<Project[]>(projects);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync when projects prop changes
  useEffect(() => {
    setSortedProjects(projects);
  }, [projects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleSortByPriority = () => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...sortedProjects].sort(
      (a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );
    setSortedProjects(sorted);
    setIsMenuOpen(false);
  };

  const handleSortByDueDate = () => {
    const sorted = [...sortedProjects].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    setSortedProjects(sorted);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 min-w-[240px] lg:min-w-[280px] flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm leading-5 text-neutral-500">
            {title}
          </span>
          {/* Count Badge */}
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-neutral-200" />
            <span className="absolute inset-0 flex items-center justify-center font-medium text-xs text-neutral-500">
              {sortedProjects.length}
            </span>
          </div>
        </div>

        {/* More Options */}
        <div ref={menuRef} className="relative">
          <button
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Column options"
          >
            <MoreVertIcon />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-30 min-w-[170px] animate-dropdown">
              <button
                className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                onClick={handleSortByPriority}
              >
                <SortIcon />
                Sort by Priority
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                onClick={handleSortByDueDate}
              >
                <SortIcon />
                Sort by Due Date
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Cards */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
        {sortedProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onClick={() => onProjectClick?.(project)} />
        ))}
      </div>
    </div>
  );
}
