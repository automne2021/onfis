import type { CalendarEvent } from "./types";

interface CalendarEventBadgeProps {
  event: CalendarEvent;
  compact?: boolean;
}

const colorClasses: Record<CalendarEvent["color"], { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-white" },
  success: { bg: "bg-action-success", text: "text-white" },
  error: { bg: "bg-action-error", text: "text-white" },
  warning: { bg: "bg-priority-high", text: "text-white" },
  info: { bg: "bg-primary-hover", text: "text-white" },
  purple: { bg: "bg-tag-scope", text: "text-white" },
  neutral: { bg: "bg-neutral-200", text: "text-neutral-700" },
};

export default function CalendarEventBadge({ event, compact = false }: CalendarEventBadgeProps) {
  const colors = colorClasses[event.color];
  
  return (
    <div
      className={`
        ${colors.bg} ${colors.text}
        rounded px-2 py-0.5 text-xs font-medium truncate
        ${compact ? "max-w-full" : ""}
        cursor-pointer hover:opacity-90 transition-opacity
      `}
      title={event.title}
    >
      {event.dueTime && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white/70 rounded-full" />
          <span className="text-[10px] opacity-80">{event.dueTime}</span>
        </span>
      )}
      <span className="block truncate">{event.title}</span>
    </div>
  );
}
