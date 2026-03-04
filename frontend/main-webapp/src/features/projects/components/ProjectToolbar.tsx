import { useState } from "react";
import type { ReactElement } from "react";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { AddIcon, SearchIcon, KanbanIcon, ListIcon, TimelineIcon, CalendarViewIcon as CalendarIcon } from "../../../components/common/Icons";

type ViewMode = "kanban" | "list" | "timeline" | "calendar";

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "planning", label: "Planning" },
      { value: "in_progress", label: "In Progress" },
      { value: "on_hold", label: "On Hold" },
      { value: "completed", label: "Completed" },
    ],
  },
  {
    key: "priority",
    label: "Priority",
    options: [
      { value: "high", label: "High", color: "bg-[#FF6900]" },
      { value: "medium", label: "Medium", color: "bg-[#FFD230]" },
      { value: "low", label: "Low", color: "bg-neutral-400" },
    ],
  },
];

interface ProjectToolbarProps {
  onNewProject: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ProjectToolbar({
  onNewProject,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: ProjectToolbarProps) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  const viewModes: { mode: ViewMode; icon: (active: boolean) => ReactElement }[] = [
    { mode: "kanban", icon: (active) => <KanbanIcon active={active} /> },
    { mode: "list", icon: (active) => <ListIcon active={active} /> },
    { mode: "timeline", icon: (active) => <TimelineIcon active={active} /> },
    { mode: "calendar", icon: (active) => <CalendarIcon active={active} /> },
  ];

  return (
    <div className="bg-white grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-100 mx-3 mt-3">
      {/* Left: Breadcrumb + New Project */}
      <div className="flex items-center gap-2">
        <h1 className="font-normal text-xs leading-4 text-black">Project</h1>
        <button
          onClick={onNewProject}
          className="bg-secondary border border-primary flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-primary font-medium text-xs leading-4 hover:bg-secondary/80 btn-hover"
        >
          <AddIcon />
          <span>New Project</span>
        </button>
      </div>

      {/* Center: Search */}
      <div className="justify-self-center w-[160px] lg:w-[200px]">
        <div className="bg-white border border-neutral-200 rounded-[8px] flex items-center gap-1.5 px-2 h-7">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-neutral-900 text-xs font-normal placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Right: Filter + View Toggle */}
      <div className="flex items-center gap-2">
        <FilterDropdown
          categories={FILTER_CATEGORIES}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
        />
        <div className="flex items-center rounded-[6px] overflow-hidden">
          {viewModes.map(({ mode, icon }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`p-1.5 transition-colors ${viewMode === mode
                ? "bg-primary"
                : "bg-neutral-200 hover:bg-neutral-300"
                }`}
              aria-label={`${mode} view`}
            >
              {icon(viewMode === mode)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
