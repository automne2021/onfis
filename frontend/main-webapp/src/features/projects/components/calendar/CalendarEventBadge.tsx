import type { ProjectCalendarEvent } from "./types";
import { eventColors } from "./types";

interface CalendarEventBadgeProps {
  event: ProjectCalendarEvent;
  onClick?: () => void;
  compact?: boolean;
}

export default function CalendarEventBadge({ event, onClick, compact = false }: CalendarEventBadgeProps) {
  const colors = eventColors[event.color];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full px-2 py-1 rounded text-xs font-medium truncate text-left border-l-2 ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity`}
        title={event.title}
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1.5 rounded-md text-xs font-medium truncate text-left border-l-2 ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity`}
      title={event.title}
    >
      <div className="truncate">{event.title}</div>
      <div className="text-xs opacity-70">
        Due: {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </button>
  );
}
