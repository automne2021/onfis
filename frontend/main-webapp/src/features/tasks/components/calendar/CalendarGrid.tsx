import type { CalendarDay } from "./types";
import { getFullDayNames } from "./calendarUtils";
import CalendarEventBadge from "./CalendarEventBadge";

interface CalendarGridProps {
  days: CalendarDay[];
  onDayClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
}

const MAX_VISIBLE_EVENTS = 2;

export default function CalendarGrid({ days, onDayClick, onEventClick }: CalendarGridProps) {
  const dayNames = getFullDayNames();

  // Split days into weeks (6 rows of 7 days)
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex-1 border border-neutral-200 rounded-xl overflow-hidden bg-white">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`
              py-2 text-center text-xs font-medium
              ${index === 0 || index === 6 ? "text-neutral-400" : "text-neutral-700"}
              ${index < 6 ? "border-r border-neutral-200" : ""}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1">
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className={`grid grid-cols-7 ${weekIndex < weeks.length - 1 ? "border-b border-neutral-200" : ""}`}
          >
            {week.map((day, dayIndex) => {
              const hiddenEventsCount = day.events.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={day.date.toISOString()}
                  onClick={() => onDayClick?.(day.date)}
                  className={`
                    min-h-[80px] lg:min-h-[90px] p-1.5 
                    ${dayIndex < 6 ? "border-r border-neutral-200" : ""}
                    ${!day.isCurrentMonth ? "bg-neutral-50" : "bg-white"}
                    hover:bg-neutral-50/50 cursor-pointer transition-colors
                  `}
                >
                  {/* Day Number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={`
                        w-6 h-6 flex items-center justify-center text-xs rounded-full
                        ${day.isToday
                          ? "bg-primary text-white font-semibold"
                          : day.isCurrentMonth
                            ? day.isWeekend
                              ? "text-neutral-400"
                              : "text-neutral-700"
                            : "text-neutral-300"
                        }
                      `}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {day.events.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event.id);
                        }}
                      >
                        <CalendarEventBadge event={event} compact />
                      </div>
                    ))}

                    {hiddenEventsCount > 0 && (
                      <button
                        className="text-xs text-neutral-500 hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDayClick?.(day.date);
                        }}
                      >
                        +{hiddenEventsCount} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
