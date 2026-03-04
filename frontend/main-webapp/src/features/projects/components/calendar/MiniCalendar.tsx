import type { CalendarDay } from "./types";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../../components/common/Icons";
import { getMonthYear } from "./calendarUtils";

interface MiniCalendarProps {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MiniCalendar({
  year,
  month,
  days,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MiniCalendarProps) {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const isSelected = (date: Date) =>
    selectedDate &&
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  return (
    <div className="bg-white rounded-[12px] p-3 shadow-sm border border-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-neutral-900">{getMonthYear(year, month)}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={onNextMonth}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="w-7 h-7 flex items-center justify-center text-xs font-medium text-neutral-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => onSelectDate?.(day.date)}
            className={`w-7 h-7 flex items-center justify-center text-xs rounded-full transition-colors ${day.isToday
              ? "bg-primary text-white"
              : isSelected(day.date)
                ? "bg-primary/20 text-primary"
                : day.isCurrentMonth
                  ? "text-neutral-900 hover:bg-neutral-100"
                  : "text-neutral-300"
              } ${day.events.length > 0 && !day.isToday && !isSelected(day.date) ? "font-bold" : ""}`}
          >
            {day.date.getDate()}
            {day.events.length > 0 && !day.isToday && (
              <span className="absolute w-1 h-1 bg-primary rounded-full mt-6" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
