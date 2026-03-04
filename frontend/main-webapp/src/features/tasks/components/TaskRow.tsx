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
      className={`flex items-center gap-3 lg:gap-6 xl:gap-8 px-3 py-2 w-full cursor-pointer hover:bg-neutral-50 transition-colors ${isLastInStage ? "border-b border-neutral-200" : "border-t border-neutral-200"
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
      <div className="w-[120px] lg:w-[140px] flex-shrink-0 flex items-center gap-2 px-2 py-1.5">
        <StatusDot status={task.progress >= 100 ? "done" : "on_track"} />
        <span className="font-bold text-sm leading-5 text-neutral-900 truncate">
          {task.title}
        </span>
        <FlagIconSmall priority={task.priority} />
      </div>

      {/* Assignees Column */}
      <div className="w-[80px] lg:w-[90px] flex-shrink-0">
        <AssigneesGroup assignees={task.assignees} maxVisible={3} />
      </div>

      {/* Tags Column */}
      <div className="w-[70px] lg:w-[80px] flex-shrink-0 flex items-center gap-1 flex-wrap">
        {task.tags?.map((tag) => (
          <TagBadge key={tag.id} type={tag.type} label={tag.label} />
        ))}
      </div>

      {/* Due Date Column */}
      <div className="w-[70px] lg:w-[80px] flex-shrink-0">
        <span className="font-medium text-xs leading-4 text-neutral-500">
          {task.dueDate}
        </span>
      </div>

      {/* Progress Column */}
      <div className="flex-1 min-w-[80px] flex items-center gap-3 lg:gap-5 pr-1.5">
        <ProgressBar progress={task.progress} />
        <span className="font-medium text-xs leading-4 text-neutral-500 w-8">
          {task.progress}%
        </span>
      </div>
    </div>
  );
}
