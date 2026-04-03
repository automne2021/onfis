import { ChevronLeftIcon, ChevronRightIcon } from "../../../../components/common/Icons";
import { getDayNames, getCalendarDays } from "./calendarUtils";

interface MiniCalendarProps {
  year: number;
  month: number;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MiniCalendar({
  year,
  month,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}: MiniCalendarProps) {

  const dayNames = getDayNames();
  const days = getCalendarDays(year, month, []);

  // Split into weeks
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={onNextMonth}
            className="p-1 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((name, index) => (
          <div
            key={name}
            className={`text-center text-xs font-medium py-1 ${index === 0 || index === 6 ? "text-neutral-400" : "text-neutral-500"
              }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="space-y-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((day) => (
              <button
                key={day.date.toISOString()}
                onClick={() => onDateSelect?.(day.date)}
                className={`
                  w-7 h-7 flex items-center justify-center text-xs rounded-full
                  transition-colors
                  ${day.isToday && !isSelectedDate(day.date)
                    ? "bg-primary text-white font-semibold"
                    : isSelectedDate(day.date)
                      ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : day.isCurrentMonth
                        ? day.isWeekend
                          ? "text-neutral-400 hover:bg-neutral-100"
                          : "text-neutral-700 hover:bg-neutral-100"
                        : "text-neutral-300"
                  }
                `}
                disabled={!day.isCurrentMonth}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
