import type { Project } from "../../types";
import { CheckboxIconList as CheckboxIcon, CalendarIcon, FlagIconColored as FlagIcon, MoreIcon } from "../../../../components/common/Icons";
import { statusLabels, statusColors } from "./types";

interface ProjectListRowProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

// Priority colors
const priorityColors = {
  urgent: "#E7000B",
  high: "#FF6900",
  medium: "#FFD230",
  low: "#99A1AF",
};

// Avatar stack for assignees
const AvatarStack = ({ assignees }: { assignees: Project["assignees"] }) => {
  const displayCount = Math.min(assignees.length, 3);
  const displayAssignees = assignees.slice(0, displayCount);
  const remaining = assignees.length - displayCount;

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
      {remaining > 0 && (
        <div className="w-6 h-6 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-xs font-medium text-neutral-600">
          +{remaining}
        </div>
      )}
    </div>
  );
};

// Progress bar
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${Math.max(progress, 1)}%` }}
      />
    </div>
    <span className="text-xs text-neutral-500 w-8 text-right">{progress}%</span>
  </div>
);

// Status badge
const StatusBadge = ({ status }: { status: Project["status"] }) => {
  const { bg, text } = statusColors[status];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {statusLabels[status]}
    </span>
  );
};

export default function ProjectListRow({
  project,
  isSelected,
  onSelect,
  onClick,
}: ProjectListRowProps) {
  return (
    <div
      className={`px-3 py-2 grid grid-cols-[32px_2fr_1fr_1fr_1fr_100px_90px_48px] gap-3 items-center border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer ${isSelected ? "bg-primary/5" : ""
        }`}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className="flex items-center justify-center hover:opacity-80"
        aria-label={isSelected ? "Deselect project" : "Select project"}
      >
        <CheckboxIcon checked={isSelected} />
      </button>

      {/* Project Name & Tags */}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-medium text-sm text-neutral-900 truncate">{project.title}</span>
        <div className="flex gap-1 flex-wrap">
          {project.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-0.5 rounded-full ${tag.type === "department"
                ? "bg-tag-department/15 text-tag-department"
                : "bg-tag-scope/15 text-tag-scope"
                }`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress */}
      <div>
        <ProgressBar progress={project.progress} />
      </div>

      {/* Assignees */}
      <div>
        <AvatarStack assignees={project.assignees} />
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <CalendarIcon />
        <span>{project.dueDate}</span>
      </div>

      {/* Priority */}
      <div className="flex items-center gap-2">
        <FlagIcon color={priorityColors[project.priority]} />
        <span className="text-xs text-neutral-600 capitalize">{project.priority}</span>
      </div>

      {/* Actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Open actions menu
        }}
        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        aria-label="More actions"
      >
        <MoreIcon />
      </button>
    </div>
  );
}
