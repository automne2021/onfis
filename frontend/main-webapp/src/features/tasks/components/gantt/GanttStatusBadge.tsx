import type { GanttTaskStatus } from "./types";
import { statusColors, statusLabels } from "./types";

interface GanttStatusBadgeProps {
  status: GanttTaskStatus;
}

export default function GanttStatusBadge({ status }: GanttStatusBadgeProps) {
  const { bg, text } = statusColors[status];
  const label = statusLabels[status];

  return (
    <div
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full ${bg}`}
    >
      <span className={`font-medium text-xs leading-4 ${text} whitespace-nowrap`}>
        {label}
      </span>
    </div>
  );
}
