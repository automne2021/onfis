import type { Stage } from "../types";
import {
  Checkbox,
  CheckboxChecked,
  ArrowDropDownIcon,
  ArrowRightIcon,
  ListAddIcon,
  QuantityBadge,
} from "../../../components/common/Icons";

interface StageRowProps {
  stage: Stage;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onAddTask: () => void;
}

export default function StageRow({
  stage,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onAddTask,
}: StageRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 w-full rounded-lg row-hover">
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        className="flex-shrink-0 focus:outline-none"
        aria-label={isSelected ? "Deselect stage" : "Select stage"}
      >
        {isSelected ? <CheckboxChecked /> : <Checkbox checked={false} />}
      </button>

      {/* Stage Info */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        {/* Expand/Collapse Arrow */}
        <button
          onClick={onToggleExpand}
          className="flex-shrink-0 focus:outline-none hover:bg-neutral-100 rounded transition-colors"
          aria-label={isExpanded ? "Collapse stage" : "Expand stage"}
        >
          {isExpanded ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
        </button>

        {/* Stage Title */}
        <span className="font-bold text-sm leading-5 text-neutral-500 whitespace-nowrap">
          {stage.title.toUpperCase()}
        </span>

        {/* Task Count Badge */}
        <QuantityBadge count={stage.tasks.length} />

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="flex-shrink-0 focus:outline-none hover:bg-neutral-100 rounded transition-colors p-0.5"
          aria-label="Add task to stage"
        >
          <ListAddIcon />
        </button>
      </div>
    </div>
  );
}
