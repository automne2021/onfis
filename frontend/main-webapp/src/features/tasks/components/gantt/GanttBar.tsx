import type { GanttTask, GanttTimelineConfig } from "./types";
import { statusColors } from "./types";
import { calculateBarPosition } from "./ganttUtils";

interface GanttBarProps {
  task: GanttTask;
  config: GanttTimelineConfig;
  onClick?: () => void;
}

export default function GanttBar({ task, config, onClick }: GanttBarProps) {
  const { left, width } = calculateBarPosition(task, config);
  const { bar: bgColor } = statusColors[task.status];

  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-md ${bgColor} hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center overflow-hidden`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        minWidth: "24px",
      }}
      title={`${task.name}: ${task.startDate.toLocaleDateString()} - ${task.endDate.toLocaleDateString()}`}
    >
      {width > 80 && (
        <span className="text-white text-xs font-medium truncate px-2">
          {task.name}
        </span>
      )}
    </button>
  );
}
