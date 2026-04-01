import { ChevronLeftIcon, ChevronRightIcon, CalendarDateIcon as CalendarIcon, TodayIcon } from "../../../../components/common/Icons";
import type { TimelineViewMode } from "./types";
import { getMonthName } from "./timelineUtils";

interface TimelineToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: TimelineViewMode;
  onViewModeChange: (mode: TimelineViewMode) => void;
}

export default function TimelineToolbar({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}: TimelineToolbarProps) {
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 14);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 14);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const viewModes: { mode: TimelineViewMode; label: string }[] = [
    { mode: "day", label: "Day" },
    { mode: "week", label: "Week" },
    { mode: "month", label: "Month" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 bg-white border-b border-neutral-200">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"
            aria-label="Previous"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={handleNext}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"
            aria-label="Next"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarIcon />
          <span className="font-medium text-xs text-neutral-900">{getMonthName(currentDate)}</span>
        </div>

        <button
          onClick={handleToday}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <TodayIcon />
          <span>Today</span>
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg overflow-hidden border border-neutral-200">
          {viewModes.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === mode
                ? "bg-primary text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
