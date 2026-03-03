import type { ReactElement } from "react";
import type { ViewMode } from "../../types";
import {
  ListViewIcon,
  BoardViewIcon,
  TimelineViewIcon,
  CalendarTabIcon,
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

type ViewTab = {
  mode: ViewMode;
  label: string;
  icon: (active: boolean) => ReactElement;
};

const viewTabs: ViewTab[] = [
  { mode: "list", label: "List", icon: (active) => <ListViewIcon active={active} /> },
  { mode: "kanban", label: "Board", icon: (active) => <BoardViewIcon active={active} /> },
  { mode: "timeline", label: "Timeline", icon: (active) => <TimelineViewIcon active={active} /> },
  { mode: "calendar", label: "Calendar", icon: (active) => <CalendarTabIcon active={active} /> },
];

export default function CalendarHeader({
  currentMonth,
  currentYear,
  viewMode,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewModeChange,
  onFilter,
  onSettings,
}: CalendarHeaderProps) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded-lg">
        {viewTabs.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
              ${viewMode === mode
                ? "bg-white text-primary shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
              }
            `}
          >
            {icon(viewMode === mode)}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

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
