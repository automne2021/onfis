import type { Task } from "../types";
import { FlagIcon, CalendarIcon } from "../../../components/common/Icons";
import Icon from "../../../components/common/Icon";
import { STATUS_CONFIG } from "../workflowUtils";

// Effort badge component
const EffortBadge = ({ estimated, actual }: { estimated?: number; actual?: number }) => {
  if (estimated == null && actual == null) return null;

  const est = estimated ?? 0;
  const act = actual ?? 0;
  const isOverBudget = act > est && est > 0;

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isOverBudget
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-neutral-100 text-neutral-500"
        }`}
      title={isOverBudget ? `Over budget: ${act}h logged vs ${est}h estimated` : `Effort: ${act}h / ${est}h`}
    >
      {isOverBudget && <Icon name="warning" size={14} color="#DC2626" />}
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
      <span className="font-medium text-xs leading-4 text-neutral-500 w-8 text-right shrink-0">
        {progress}%
      </span>
    </div>
  );
};

// Avatar stack component
const AvatarStack = ({ assignees }: { assignees: Task["assignees"] }) => {
  const displayCount = Math.min(assignees.length, 3);
  const displayAssignees = assignees.slice(0, displayCount);

  return (
    <div className="flex -space-x-2">
      {displayAssignees.map((assignee, index) => (
        <div
          key={assignee.id}
          className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white"
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

// Blocked indicator
const BlockedIndicator = ({ blockedBy }: { blockedBy?: string[] }) => {
  if (!blockedBy || blockedBy.length === 0) return null;
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
      title={`Blocked by: ${blockedBy.join(", ")}`}
    >
      <Icon name="block" size={14} color="#DC2626" /> Blocked
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <div
      className="bg-white rounded-[12px] shadow-sm border border-neutral-100 px-3 py-3 flex flex-col gap-3 cursor-pointer overflow-hidden min-w-0 card-hover"
      onClick={onClick}
    >
      {/* Header: Title + Priority Flag */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-sm leading-5 text-neutral-900 flex-1">
          {task.title}
        </h3>
        <FlagIcon priority={task.priority} />
      </div>

      {/* Description */}
      <p className="font-normal text-xs leading-4 text-neutral-400 line-clamp-2">
        {task.description}
      </p>

      {/* Effort & Blocked badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <EffortBadge estimated={task.estimatedEffort} actual={task.actualEffort} />
        <BlockedIndicator blockedBy={task.blockedBy} />
      </div>

      {/* Progress */}
      <ProgressBar progress={task.progress} />

      {/* Divider */}
      <div className="w-full h-px bg-neutral-200" />

      {/* Footer: Avatars + Due Date + Status Indicator */}
      <div className="flex items-center justify-between">
        <AvatarStack assignees={task.assignees} />

        <div className="flex items-center gap-2">
          <CalendarIcon />
          <span className="font-medium text-xs leading-4 text-neutral-400">
            {task.dueDate}
          </span>
        </div>

        {/* Status dot with label */}
        <div className="flex items-center gap-1.5" title={statusConfig.label}>
          <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.color}`} />
          <span className="text-xs font-medium text-neutral-500">{statusConfig.label}</span>
        </div>
      </div>
    </div>
  );
}
