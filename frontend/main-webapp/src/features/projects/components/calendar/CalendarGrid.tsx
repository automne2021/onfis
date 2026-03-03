import type { CalendarDay, ProjectCalendarEvent } from "./types";
import { getDayNames } from "./calendarUtils";
import CalendarEventBadge from "./CalendarEventBadge";

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  onEventClick?: (event: ProjectCalendarEvent) => void;
}

export default function CalendarGrid({
  days,
  selectedDate,
  onSelectDate,
  onEventClick,
}: CalendarGridProps) {
  const dayNames = getDayNames();
  const MAX_VISIBLE_EVENTS = 2;

  const isSelected = (date: Date) =>
    selectedDate &&
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200">
        {dayNames.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-neutral-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0">
        {days.map((day, index) => {
          const hasMoreEvents = day.events.length > MAX_VISIBLE_EVENTS;
          const visibleEvents = day.events.slice(0, MAX_VISIBLE_EVENTS);

          return (
            <div
              key={index}
              className={`relative border-r border-b border-neutral-100 p-1.5 min-h-[80px] cursor-pointer transition-colors hover:bg-neutral-50 ${!day.isCurrentMonth ? "bg-neutral-50/50" : ""
                } ${day.isWeekend ? "bg-neutral-50/30" : ""} ${isSelected(day.date) ? "bg-primary/5 ring-2 ring-primary ring-inset" : ""
                }`}
              onClick={() => onSelectDate?.(day.date)}
            >
              {/* Date Number */}
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1 ${day.isToday
                    ? "bg-primary text-white"
                    : day.isCurrentMonth
                      ? "text-neutral-900"
                      : "text-neutral-400"
                  }`}
              >
                {day.date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1 overflow-hidden">
                {visibleEvents.map((event) => (
                  <CalendarEventBadge
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
                {hasMoreEvents && (
                  <button
                    className="text-xs text-neutral-500 hover:text-primary font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate?.(day.date);
                    }}
                  >
                    +{day.events.length - MAX_VISIBLE_EVENTS} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
