import type { ViewMode } from "../../types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterLinesIcon,
  SettingsGearIcon,
} from "../../../../components/common/Icons";

interface CalendarHeaderProps {
  currentMonth: number;
  currentYear: number;
  viewMode: ViewMode;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilter?: () => void;
  onSettings?: () => void;
}

export default function CalendarHeader({
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
  onToday,
  onFilter,
  onSettings,
}: CalendarHeaderProps) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 pb-3 mt-2">

      {/* Month Navigation & Actions */}
      <div className="flex items-center gap-2">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500"
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </button>

          <span className="text-sm font-semibold text-neutral-900 min-w-[140px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>

          <button
            onClick={onNextMonth}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500"
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Today Button */}
        <button
          onClick={onToday}
          className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Today
        </button>

        {/* Filter & Settings */}
        <div className="flex items-center gap-1">
          <button
            onClick={onFilter}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Filter"
          >
            <FilterLinesIcon />
          </button>
          <button
            onClick={onSettings}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <SettingsGearIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
