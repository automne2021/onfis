import type { ProjectCalendarEvent } from "./types";
import { eventColors } from "./types";

interface CalendarEventBadgeProps {
  event: ProjectCalendarEvent;
  onClick?: () => void;
  compact?: boolean;
}

export default function CalendarEventBadge({ event, onClick, compact = false }: CalendarEventBadgeProps) {
  const colors = eventColors[event.color];

  return (
    <div
      onClick={onClick}
      className={`
        ${colors.bg} ${colors.text}
        rounded px-2 py-0.5 text-xs font-medium truncate
        ${compact ? "max-w-full" : ""}
        cursor-pointer hover:opacity-90 transition-opacity
      `}
      title={event.title}
    >
      <span className="block truncate">{event.title}</span>
    </div>
  );
}
