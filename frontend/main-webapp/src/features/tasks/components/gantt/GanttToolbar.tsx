import type { GanttViewMode } from "./types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../../../components/common/Icons";

interface GanttToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: GanttViewMode;
  onViewModeChange: (mode: GanttViewMode) => void;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function GanttToolbar({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}: GanttToolbarProps) {
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const viewModes: { mode: GanttViewMode; label: string }[] = [
    { mode: "day", label: "Day" },
    { mode: "week", label: "Week" },
    { mode: "month", label: "Month" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 py-2 border-b border-neutral-200">

      {/* Center Section: Date Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>

        <span className="text-xs font-semibold text-neutral-900 min-w-[130px] text-center">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label="Next month"
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

      {/* Right Section: View Mode Toggle */}
      <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
        {viewModes.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === mode
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
