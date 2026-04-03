import { useState, useMemo } from "react";
import { CalendarTodayIcon, EventIcon, DateRangeIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  allowClear?: boolean;
  showLunarDay?: boolean;
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateOnly(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
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
  const parts = dateString.split("-");
  if (parts.length !== 3) {
    return null;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) {
    return null;
  }
  return toDateOnly(date);
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Select Duration",
  minDate,
  maxDate,
  disablePast = false,
  allowClear = true,
  showLunarDay = false,
}: DateRangePickerProps) {
  const normalizedStartDate = startDate ? toDateOnly(startDate) : null;
  const normalizedEndDate = endDate ? toDateOnly(endDate) : null;

  const effectiveMinDate = useMemo(() => {
    const normalizedMinDate = minDate ? toDateOnly(minDate) : null;
    if (!disablePast) {
      return normalizedMinDate;
    }

    const today = toDateOnly(new Date());
    if (!normalizedMinDate) {
      return today;
    }
    return normalizedMinDate > today ? normalizedMinDate : today;
  }, [disablePast, minDate]);

  const effectiveMaxDate = useMemo(
    () => (maxDate ? toDateOnly(maxDate) : null),
    [maxDate],
  );

  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = normalizedStartDate || effectiveMinDate || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const lunarDayFormatter = useMemo(() => {
    if (!showLunarDay) {
      return null;
    }
    try {
      return new Intl.DateTimeFormat("vi-VN-u-ca-chinese", { day: "numeric" });
    } catch {
      return null;
    }
  }, [showLunarDay]);

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

  const isDateDisabled = (date: Date) => {
    const normalized = toDateOnly(date);
    if (effectiveMinDate && normalized < effectiveMinDate) {
      return true;
    }
    if (effectiveMaxDate && normalized > effectiveMaxDate) {
      return true;
    }
    return false;
  };

  const getLunarDay = (date: Date) => {
    if (!lunarDayFormatter) {
      return "";
    }
    try {
      return lunarDayFormatter.format(date);
    } catch {
      return "";
    }
  };

  const handleDateClick = (date: Date) => {
    const normalizedDate = toDateOnly(date);
    if (isDateDisabled(normalizedDate)) {
      return;
    }

    if (!normalizedStartDate || (normalizedStartDate && normalizedEndDate)) {
      onStartDateChange(normalizedDate);
      onEndDateChange(null);
    } else if (normalizedDate < normalizedStartDate) {
      onStartDateChange(normalizedDate);
    } else {
      onEndDateChange(normalizedDate);
    }
  };

  const handleStartInputChange = (date: Date | null) => {
    if (date && isDateDisabled(date)) {
      return;
    }
    if (date && normalizedEndDate && date > normalizedEndDate) {
      onEndDateChange(null);
    }
    onStartDateChange(date);
  };

  const handleEndInputChange = (date: Date | null) => {
    if (date && isDateDisabled(date)) {
      return;
    }
    if (date && normalizedStartDate && date < normalizedStartDate) {
      return;
    }
    onEndDateChange(date);
  };

  const isInRange = (date: Date) => {
    if (!normalizedStartDate || !normalizedEndDate) return false;
    return date > normalizedStartDate && date < normalizedEndDate;
  };

  const isStartDate = (date: Date) => {
    return normalizedStartDate && date.toDateString() === normalizedStartDate.toDateString();
  };

  const isEndDate = (date: Date) => {
    return normalizedEndDate && date.toDateString() === normalizedEndDate.toDateString();
  };

  const startInputMaxDate = useMemo(() => {
    const candidates: Date[] = [];
    if (normalizedEndDate) {
      candidates.push(normalizedEndDate);
    }
    if (effectiveMaxDate) {
      candidates.push(effectiveMaxDate);
    }
    if (candidates.length === 0) {
      return null;
    }
    return candidates.reduce((earliest, candidate) =>
      candidate < earliest ? candidate : earliest,
    );
  }, [normalizedEndDate, effectiveMaxDate]);

  const endInputMinDate = useMemo(() => {
    const candidates: Date[] = [];
    if (normalizedStartDate) {
      candidates.push(normalizedStartDate);
    }
    if (effectiveMinDate) {
      candidates.push(effectiveMinDate);
    }
    if (candidates.length === 0) {
      return null;
    }
    return candidates.reduce((latest, candidate) =>
      candidate > latest ? candidate : latest,
    );
  }, [normalizedStartDate, effectiveMinDate]);

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
      const normalizedDate = toDateOnly(date);
      const isStart = isStartDate(date);
      const isEnd = isEndDate(date);
      const inRange = isInRange(date);
      const isDisabled = isDateDisabled(date);
      const lunarDay = getLunarDay(normalizedDate);

      let className =
        "h-9 w-full inline-flex items-center justify-center gap-1 text-xs font-medium transition-colors ";

      if (isDisabled) {
        className += "rounded-md bg-neutral-50 text-neutral-300 cursor-not-allowed ";
      } else if (isStart) {
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
          onClick={() => handleDateClick(normalizedDate)}
          disabled={isDisabled}
          className={className}
        >
          <span>{day}</span>
          {showLunarDay && lunarDay && (
            <span className={`text-[9px] font-semibold ${isStart || isEnd ? "text-red-100" : "text-red-500"}`}>
              {lunarDay}
            </span>
          )}
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
              min={effectiveMinDate ? formatDate(effectiveMinDate) : undefined}
              max={startInputMaxDate ? formatDate(startInputMaxDate) : undefined}
              onChange={(e) => handleStartInputChange(parseDate(e.target.value))}
              className="w-full pl-10 pr-14 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
              <CalendarTodayIcon />
            </div>
            {allowClear && startDate && (
              <button
                type="button"
                onClick={() => onStartDateChange(null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            )}
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
              min={endInputMinDate ? formatDate(endInputMinDate) : undefined}
              max={effectiveMaxDate ? formatDate(effectiveMaxDate) : undefined}
              onChange={(e) => handleEndInputChange(parseDate(e.target.value))}
              className="w-full pl-10 pr-14 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
              <EventIcon />
            </div>
            {allowClear && endDate && (
              <button
                type="button"
                onClick={() => onEndDateChange(null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Picker */}
      <div className="border border-neutral-200 rounded-lg p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-primary"><DateRangeIcon /></span>
            <h3 className="text-sm font-bold text-neutral-900">{label}</h3>
            {allowClear && (startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  onStartDateChange(null);
                  onEndDateChange(null);
                }}
                className="text-xs font-semibold text-primary hover:text-primary/80"
              >
                Clear dates
              </button>
            )}
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
