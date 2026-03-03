import { Checkbox } from "../../../components/common/Icons";

export default function TaskListHeader() {
  return (
    <div className="bg-secondary flex items-center gap-3 lg:gap-6 xl:gap-8 px-3 py-2 w-full">
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox checked={false} />
      </div>

      {/* Title Column */}
      <div className="w-[120px] lg:w-[140px] flex-shrink-0">
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Title
        </span>
      </div>

      {/* Assignees Column */}
      <div className="w-[80px] lg:w-[90px] flex-shrink-0">
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Assignees
        </span>
      </div>

      {/* Tags Column */}
      <div className="w-[70px] lg:w-[80px] flex-shrink-0">
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Tags
        </span>
      </div>

      {/* Due Date Column */}
      <div className="w-[70px] lg:w-[80px] flex-shrink-0">
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Due date
        </span>
      </div>

      {/* Progress Column */}
      <div className="flex-1 min-w-[80px]">
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Progress
        </span>
      </div>
    </div>
  );
}
