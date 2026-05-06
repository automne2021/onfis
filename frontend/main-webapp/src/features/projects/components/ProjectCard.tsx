import { useNavigate } from "react-router-dom";
import type { Project, Tag } from "../types";
import { FlagIcon, CalendarIcon, EyeIcon, TasksViewIcon as TasksIcon } from "../../../components/common/Icons";
import { useTenantPath } from "../../../hooks/useTenantPath";
import InitialsAvatar from "../../../components/common/InitialsAvatar";

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
        <div key={assignee.id} style={{ zIndex: displayCount - index }} title={assignee.name}>
          <InitialsAvatar name={assignee.name} size={24} />
        </div>
      ))}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { withTenant } = useTenantPath();

  return (
    <div className="group relative bg-white rounded-[12px] shadow-sm border border-neutral-100 px-3 py-3 flex flex-col gap-3 overflow-hidden min-w-0 cursor-pointer card-hover">
      {/* Hover Overlay */}
      <div className="absolute inset-0 z-20 bg-primary/85 rounded-[12px] flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(withTenant(`/projects/${project.slug}`));
          }}
          className="w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary rounded-lg font-medium text-sm hover:bg-neutral-50 transition-colors shadow-md"
        >
          <EyeIcon />
          View Detail
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(withTenant(`/projects/${project.slug}/tasks`));
          }}
          className="w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/40 rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
        >
          <TasksIcon />
          View Task
        </button>
      </div>

      {/* Header: Tags + Priority */}
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag, index) => (
            <TagBadge key={index} tag={tag} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <FlagIcon priority={project.priority} />
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
