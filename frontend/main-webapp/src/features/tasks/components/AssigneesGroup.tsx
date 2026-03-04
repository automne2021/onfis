import type { Assignee } from "../types";

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

  // Generate a consistent color based on the user's name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
      "bg-primary",
      "bg-tag-department",
      "bg-tag-scope",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center -space-x-2">
      {visibleAssignees.map((assignee) => (
        <div
          key={assignee.id}
          className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium overflow-hidden ${
            assignee.avatar ? "" : getAvatarColor(assignee.name)
          }`}
          title={assignee.name}
        >
          {assignee.avatar ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitial(assignee.name)
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="w-10 h-10 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center text-neutral-500 text-sm font-medium"
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
