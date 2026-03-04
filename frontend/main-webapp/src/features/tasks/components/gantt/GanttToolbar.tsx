import { useState } from "react";
import type { GanttViewMode } from "./types";
import {
  FilterIcon,
  GroupByIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../../../components/common/Icons";

interface GanttToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: GanttViewMode;
  onViewModeChange: (mode: GanttViewMode) => void;
  onFilter?: () => void;
  onGroupBy?: () => void;
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
  onFilter,
  onGroupBy,
}: GanttToolbarProps) {
  const [isGroupByOpen, setIsGroupByOpen] = useState(false);

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
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-neutral-200">
      {/* Left Section: Filter & Group By */}
      <div className="flex items-center gap-2">
        {/* Filter Button */}
        <button
          onClick={onFilter}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-500 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <FilterIcon />
          <span>Filter</span>
        </button>

        {/* Group By Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsGroupByOpen(!isGroupByOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-500 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <GroupByIcon />
            <span>Group By</span>
          </button>
          {isGroupByOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  onGroupBy?.();
                  setIsGroupByOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-neutral-50 transition-colors"
              >
                By Status
              </button>
              <button
                onClick={() => {
                  onGroupBy?.();
                  setIsGroupByOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-neutral-50 transition-colors"
              >
                By Assignee
              </button>
              <button
                onClick={() => {
                  onGroupBy?.();
                  setIsGroupByOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-neutral-50 transition-colors"
              >
                By Priority
              </button>
            </div>
          )}
        </div>
      </div>

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
