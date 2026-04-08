import { ChevronLeftIcon, ChevronRightIcon } from "../../../../components/common/Icons";
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
    <div className="flex flex-wrap items-center justify-end gap-2 py-2 border-b border-neutral-200">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-1 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label="Previous"
        >
          <ChevronLeftIcon />
        </button>

        <span className="text-xs font-semibold text-neutral-900 min-w-[130px] text-center">
          {getMonthName(currentDate)}
        </span>

        <button
          onClick={handleNext}
          className="p-1 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label="Next"
        >
          <ChevronRightIcon />
        </button>

        <button
          onClick={handleToday}
          className="px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
        >
          Today
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
        {viewModes.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === mode
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
