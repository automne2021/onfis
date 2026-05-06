import type { Assignee } from "../types";
import InitialsAvatar from "../../../components/common/InitialsAvatar";

interface AssigneesGroupProps {
  assignees: Assignee[];
  maxVisible?: number;
}

export default function AssigneesGroup({
  assignees,
  maxVisible = 3,
}: AssigneesGroupProps) {
  const visibleAssignees = assignees.slice(0, maxVisible);
  const remainingCount = assignees.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2">
      {visibleAssignees.map((assignee) => (
        <div key={assignee.id} title={assignee.name}>
          <InitialsAvatar name={assignee.name} size={28} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="w-7 h-7 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center text-neutral-500 text-sm font-medium"
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
