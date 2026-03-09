import { Checkbox } from "../../../components/common/Icons";

export default function TaskListHeader() {
  return (
    <div className="bg-neutral-50 border-b border-neutral-200 grid grid-cols-[32px_2fr_1fr_1fr_1fr_1.5fr] gap-3 items-center px-3 py-2 w-full sticky top-0 z-10 text-xs font-medium text-neutral-500">
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox checked={false} />
      </div>

      {/* Title Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Title
        </span>
      </div>

      {/* Assignees Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Assignees
        </span>
      </div>

      {/* Tags Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Tags
        </span>
      </div>

      {/* Due Date Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Due date
        </span>
      </div>

      {/* Progress Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          Progress
        </span>
      </div>
    </div>
  );
}
