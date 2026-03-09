import type { Task } from "../types";
import {
  Checkbox,
  CheckboxChecked,
  StatusDot,
  FlagIconSmall,
  ProgressBar,
} from "../../../components/common/Icons";
import AssigneesGroup from "./AssigneesGroup";
import TagBadge from "./TagBadge";

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onToggleSelect: () => void;
  isLastInStage?: boolean;
  onClick?: () => void;
}

export default function TaskRow({
  task,
  isSelected,
  onToggleSelect,
  isLastInStage = false,
  onClick,
}: TaskRowProps) {
  return (
    <div
      className={`grid grid-cols-[32px_2fr_1fr_1fr_1fr_1.5fr] gap-3 items-center px-3 py-2 w-full cursor-pointer hover:bg-neutral-50 transition-colors ${isLastInStage ? "border-b border-neutral-200" : "border-t border-neutral-200"
        }`}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="flex-shrink-0 focus:outline-none"
        aria-label={isSelected ? "Deselect task" : "Select task"}
      >
        {isSelected ? <CheckboxChecked /> : <Checkbox checked={false} />}
      </button>

      {/* Title Column */}
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot status={task.progress >= 100 ? "done" : "on_track"} />
        <span className="font-bold text-sm leading-5 text-neutral-900 truncate">
          {task.title}
        </span>
        <FlagIconSmall priority={task.priority} />
      </div>

      {/* Assignees Column */}
      <div className="min-w-0">
        <AssigneesGroup assignees={task.assignees} maxVisible={3} />
      </div>

      {/* Tags Column */}
      <div className="flex items-center gap-1 flex-wrap min-w-0">
        {task.tags?.map((tag) => (
          <TagBadge key={tag.id} type={tag.type} label={tag.label} />
        ))}
      </div>

      {/* Due Date Column */}
      <div className="min-w-0">
        <span className="font-medium text-xs leading-4 text-neutral-500">
          {task.dueDate}
        </span>
      </div>

      {/* Progress Column */}
      <div className="flex items-center gap-3 min-w-0">
        <ProgressBar progress={task.progress} />
        <span className="font-medium text-xs leading-4 text-neutral-500 w-8 flex-shrink-0">
          {task.progress}%
        </span>
      </div>
    </div>
  );
}
