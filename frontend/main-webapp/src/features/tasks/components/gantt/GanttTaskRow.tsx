import type { GanttTask } from "./types";
import GanttStatusBadge from "./GanttStatusBadge";

interface GanttTaskRowProps {
  task: GanttTask;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function GanttTaskRow({ task, isSelected, onClick }: GanttTaskRowProps) {
  // Generate avatar color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
      "bg-primary",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`flex items-center h-10 border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""
        }`}
    >
      {/* Task Name */}
      <div className="flex-1 min-w-[140px] px-3 truncate">
        <span className="text-sm font-medium text-neutral-900">{task.name}</span>
      </div>

      {/* Owner */}
      <div className="w-[80px] px-2 flex justify-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden ${task.owner.avatar ? "" : getAvatarColor(task.owner.name)
            }`}
          title={task.owner.name}
        >
          {task.owner.avatar ? (
            <img
              src={task.owner.avatar}
              alt={task.owner.name}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitial(task.owner.name)
          )}
        </div>
      </div>

      {/* Status */}
      <div className="w-[80px] px-2 flex justify-center">
        <GanttStatusBadge status={task.status} />
      </div>
    </div>
  );
}
