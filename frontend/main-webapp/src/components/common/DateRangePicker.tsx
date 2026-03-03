import { useState, useMemo } from "react";
import { CalendarTodayIcon, EventIcon, DateRangeIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  label?: string;
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Select Duration",
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = startDate || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const nextMonth = useMemo(() => {
    const next = currentMonth.month + 1;
    if (next > 11) {
      return { year: currentMonth.year + 1, month: 0 };
    }
    return { year: currentMonth.year, month: next };
  }, [currentMonth]);

  const goToPrevious = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const goToNext = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      onStartDateChange(date);
      onEndDateChange(null);
    } else if (date < startDate) {
      onStartDateChange(date);
    } else {
      onEndDateChange(date);
    }
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };

  const isStartDate = (date: Date) => {
    return startDate && date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (date: Date) => {
    return endDate && date.toDateString() === endDate.toDateString();
  };

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<span key={`empty-${i}`} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isStart = isStartDate(date);
      const isEnd = isEndDate(date);
      const inRange = isInRange(date);

      let className =
        "h-9 w-full flex flex-col items-center justify-center text-xs font-medium transition-colors ";

      if (isStart) {
        className += "rounded-l-md bg-primary text-white shadow-sm ";
      } else if (isEnd) {
        className += "rounded-r-md bg-primary text-white shadow-sm ";
      } else if (inRange) {
        className += "bg-blue-50 text-neutral-900 ";
      } else {
        className += "rounded-md hover:bg-neutral-100 text-neutral-700 ";
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          className={className}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="flex-1">
        <div className="text-center font-bold text-sm mb-3 text-neutral-900">
          {monthName}
        </div>
        <div className="grid grid-cols-7 gap-y-2 mb-2">
          {DAYS_OF_WEEK.map((day, i) => (
            <span
              key={i}
              className="text-xs text-neutral-400 text-center font-medium"
            >
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-sm">{days}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formatDate(startDate)}
              onChange={(e) => onStartDateChange(parseDate(e.target.value))}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
              <CalendarTodayIcon />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formatDate(endDate)}
              onChange={(e) => onEndDateChange(parseDate(e.target.value))}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
              <EventIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Picker */}
      <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-primary"><DateRangeIcon /></span>
            <h3 className="text-sm font-bold text-neutral-900">{label}</h3>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={goToPrevious}
              className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {renderMonth(currentMonth.year, currentMonth.month)}
          {renderMonth(nextMonth.year, nextMonth.month)}
        </div>
      </div>
    </div>
  );
}
