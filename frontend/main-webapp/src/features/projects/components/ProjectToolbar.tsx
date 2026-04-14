import type { ReactElement } from "react";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { SearchIcon, KanbanIcon, ListIcon, TimelineIcon, CalendarViewIcon as CalendarIcon } from "../../../components/common/Icons";
import { Button } from "../../../components/common/Buttons/Button";

import { Add } from '@mui/icons-material';
import { ViewToggle } from "../../../components/common/ViewToggle";

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
      { value: "urgent", label: "Urgent", color: "bg-[#E7000B]" },
      { value: "high", label: "High", color: "bg-[#FF6900]" },
      { value: "medium", label: "Medium", color: "bg-[#FFD230]" },
      { value: "low", label: "Low", color: "bg-neutral-400" },
    ],
  },
];

interface ProjectToolbarProps {
  onNewProject?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ProjectToolbar({
  onNewProject,
  searchQuery,
  onSearchChange,
  activeFilters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: ProjectToolbarProps) {
  const viewModes: { mode: ViewMode; icon: (active: boolean) => ReactElement }[] = [
    { mode: "kanban", icon: (active) => <KanbanIcon active={active} /> },
    { mode: "list", icon: (active) => <ListIcon active={active} /> },
    { mode: "timeline", icon: (active) => <TimelineIcon active={active} /> },
    { mode: "calendar", icon: (active) => <CalendarIcon active={active} /> },
  ];

  return (
    <nav className="navbar-style">
      {/* Left: Breadcrumb + New Project */}
      <p className="body-3-regular text-neutral-900">Project</p>

      {/* Center: Search */}
      <div className={`flex gap-2 items-center px-4 py-2 border bg-white border-neutral-200 outline-none rounded-full transition-colors duration-200 focus-within:border-primary focus-within:bg-white w-[260px] lg:w-[380px]`}>
        <SearchIcon />
        <input
          type="text"
          placeholder={`Search...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="outline-none w-full body-4-regular"
          maxLength={250}
        />
      </div>

      {/* Right: Filter + View Toggle */}
      <div className="flex items-center gap-2">
        {onNewProject && (
          <Button
            title="New Project"
            iconLeft={<Add fontSize="small" />}
            onClick={onNewProject}
            style="primary"
            textStyle='body-4-medium'
          />
        )}
        <FilterDropdown
          categories={FILTER_CATEGORIES}
          activeFilters={activeFilters}
          onFiltersChange={onFiltersChange}
        />

        <ViewToggle 
          viewMode={viewMode}
          viewModes={viewModes}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </nav>
  );
}
