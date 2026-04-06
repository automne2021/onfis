import type { Task } from "../types";
import { FlagIcon, CalendarIcon } from "../../../components/common/Icons";
import Icon from "../../../components/common/Icon";
import { STATUS_CONFIG } from "../workflowUtils";

/** Strip HTML tags to get plain text for card previews */
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() || "";
};

// Effort badge component
const EffortBadge = ({ estimated, actual }: { estimated?: number; actual?: number }) => {
  if (estimated == null && actual == null) return null;

  const est = estimated ?? 0;
  const act = actual ?? 0;
  const isOverBudget = act > est && est > 0;

  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isOverBudget
          ? "bg-red-50 text-red-600"
          : "bg-neutral-50 text-neutral-500"
        }`}
      title={isOverBudget ? `Over budget: ${act}h logged vs ${est}h estimated` : `Effort: ${act}h / ${est}h`}
    >
      {isOverBudget && <Icon name="warning" size={12} color="#DC2626" />}
      <Icon name="schedule" size={12} />
      <span>{act}h / {est}h</span>
    </div>
  );
};

// Progress bar component
const ProgressBar = ({ progress }: { progress: number }) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    return "bg-blue-400";
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
          style={{ width: `${Math.max(progress, 1)}%` }}
        />
      </div>
      <span className="font-medium text-[10px] leading-4 text-neutral-500 w-8 text-right shrink-0">
        {progress}%
      </span>
    </div>
  );
};

// Avatar stack component
const AvatarStack = ({ assignees }: { assignees: Task["assignees"] }) => {
  const displayCount = Math.min(assignees.length, 3);
  const displayAssignees = assignees.slice(0, displayCount);
  const remaining = assignees.length - displayCount;

  return (
    <div className="flex -space-x-1.5">
      {displayAssignees.map((assignee, index) => (
        <div
          key={assignee.id}
          className="w-5 h-5 rounded-full bg-blue-400 border-[1.5px] border-white flex items-center justify-center text-[9px] font-medium text-white"
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
        <div
          className="w-5 h-5 rounded-full bg-neutral-200 border-[1.5px] border-white flex items-center justify-center text-[9px] font-medium text-neutral-600"
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

// Tag badge for card
const CardTagBadge = ({ label, type }: { label: string; type: string }) => {
  const styles: Record<string, string> = {
    department: "bg-blue-50 text-blue-600",
    scope: "bg-purple-50 text-purple-600",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[type] ?? "bg-neutral-50 text-neutral-500"}`}>
      {label}
    </span>
  );
};

// Blocked indicator
const BlockedIndicator = ({ blockedBy }: { blockedBy?: string[] }) => {
  if (!blockedBy || blockedBy.length === 0) return null;
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600"
      title={`Blocked by: ${blockedBy.join(", ")}`}
    >
      <Icon name="block" size={12} color="#DC2626" /> Blocked
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const statusConfig = STATUS_CONFIG[task.status];
  const tags = task.tags ?? [];
  const description = stripHtml(task.description);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-neutral-100 px-3 py-2.5 flex flex-col gap-2 cursor-pointer overflow-hidden min-w-0 card-hover hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Header: Key + Priority Flag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.key && (
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
              {task.key}
            </span>
          )}
          <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} title={statusConfig.label} />
        </div>
        <FlagIcon priority={task.priority} />
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm leading-5 text-neutral-900 line-clamp-2">
        {task.title}
      </h3>

      {/* Description (if present) */}
      {description && (
        <p className="text-[11px] leading-4 text-neutral-400 line-clamp-2">
          {description}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <CardTagBadge key={tag.id} label={tag.label} type={tag.type} />
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-neutral-400 self-center">+{tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Badges row: Effort + Blocked */}
      {(task.estimatedEffort != null || task.actualEffort != null || (task.blockedBy && task.blockedBy.length > 0)) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <EffortBadge estimated={task.estimatedEffort} actual={task.actualEffort} />
          <BlockedIndicator blockedBy={task.blockedBy} />
        </div>
      )}

      {/* Progress */}
      <ProgressBar progress={task.progress} />

      {/* Footer: Avatars + Due Date */}
      <div className="flex items-center justify-between pt-0.5">
        <AvatarStack assignees={task.assignees} />

        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <CalendarIcon />
              <span className="text-[10px] font-medium text-neutral-400">
                {task.dueDate}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
