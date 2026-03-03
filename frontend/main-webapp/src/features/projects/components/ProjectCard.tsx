import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, Tag } from "../types";
import { FlagIcon, CalendarIcon, MoreHorizIcon, EyeIcon, TasksViewIcon as TasksIcon } from "../../../components/common/Icons";

// Tag component
const TagBadge = ({ tag }: { tag: Tag }) => {
  const styles = {
    department: "bg-tag-department/15 text-tag-department",
    scope: "bg-tag-scope/15 text-tag-scope",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 rounded-full font-medium text-xs leading-4 ${styles[tag.type]}`}
    >
      {tag.label}
    </span>
  );
};

// Progress bar component
const ProgressBar = ({ progress, status }: { progress: number; status: Project["status"] }) => {
  const progressColors: Record<Project["status"], string> = {
    planning: "bg-status-on_hold",
    in_progress: "bg-status-on_track",
    on_hold: "bg-status-on_hold",
    completed: "bg-status-done",
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${progressColors[status]}`}
          style={{ width: `${Math.max(progress, 1)}%` }}
        />
      </div>
      <span className="font-medium text-xs leading-4 text-neutral-500 w-8 text-right">
        {progress}%
      </span>
    </div>
  );
};

// Avatar stack component
const AvatarStack = ({ assignees }: { assignees: Project["assignees"] }) => {
  const displayCount = Math.min(assignees.length, 3);
  const displayAssignees = assignees.slice(0, displayCount);

  return (
    <div className="flex -space-x-2">
      {displayAssignees.map((assignee, index) => (
        <div
          key={assignee.id}
          className="w-6 h-6 rounded-full bg-status-on_track border-2 border-white flex items-center justify-center text-xs font-medium text-neutral-900"
          style={{ zIndex: displayCount - index }}
          title={assignee.name}
        >
          {assignee.avatar ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            assignee.name.charAt(0).toUpperCase()
          )}
        </div>
      ))}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className="bg-white rounded-[12px] shadow-sm border border-neutral-100 px-3 py-3 flex flex-col gap-3 overflow-hidden min-w-0 cursor-pointer card-hover"
      onClick={onClick}
    >
      {/* Header: Tags + Priority + Menu */}
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag, index) => (
            <TagBadge key={index} tag={tag} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <FlagIcon priority={project.priority} />
          {/* Context Menu */}
          <div ref={menuRef} className="relative">
            <button
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="More options"
            >
              <MoreHorizIcon />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-30 min-w-[160px] animate-dropdown">
                <button
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  <EyeIcon />
                  View Details
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    navigate(`/projects/${project.id}/tasks`);
                  }}
                >
                  <TasksIcon />
                  View Tasks
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm leading-[18px] text-neutral-900">
        {project.title}
      </h3>


      {/* Progress */}
      <ProgressBar progress={project.progress} status={project.status} />

      {/* Divider */}
      <div className="w-full h-px bg-neutral-200" />

      {/* Footer: Avatars + Due Date */}
      <div className="flex items-center justify-between">
        <AvatarStack assignees={project.assignees} />

        <div className="flex items-center gap-2">
          <CalendarIcon />
          <span className="font-medium text-xs leading-4 text-neutral-400">
            {project.dueDate}
          </span>
        </div>
      </div>
    </div>
  );
}
