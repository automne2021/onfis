import { useState } from "react";
import { Link } from "react-router-dom";
import type { ReactElement } from "react";
import type { ViewMode } from "../types";
import {
  SearchIcon,
  KanbanIcon,
  ListIcon,
  TimelineIcon,
  CalendarViewIcon,
} from "../../../components/common/Icons";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { AddIcon } from "../../../components/common/Icons";

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "on_track", label: "On Track", color: "bg-status-on_track" },
      { value: "off_track", label: "Off Track", color: "bg-status-off_track" },
      { value: "done", label: "Done", color: "bg-status-done" },
      { value: "on_hold", label: "On Hold", color: "bg-status-on_hold" },
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
  {
    key: "assignee",
    label: "Assignee",
    options: [
      { value: "alice", label: "Alice" },
      { value: "bob", label: "Bob" },
      { value: "charlie", label: "Charlie" },
      { value: "david", label: "David" },
      { value: "eve", label: "Eve" },
    ],
  },
];

interface TaskToolbarProps {
  projectName: string;
  projectId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask?: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TaskToolbar({
  projectName,
  projectId,
  searchQuery,
  onSearchChange,
  onNewTask,
  viewMode,
  onViewModeChange,
}: TaskToolbarProps) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  const viewModes: { mode: ViewMode; icon: (active: boolean) => ReactElement }[] = [
    { mode: "kanban", icon: (active) => <KanbanIcon active={active} /> },
    { mode: "list", icon: (active) => <ListIcon active={active} /> },
    { mode: "timeline", icon: (active) => <TimelineIcon active={active} /> },
    { mode: "calendar", icon: (active) => <CalendarViewIcon active={active} /> },
  ];

  return (
    <div className="bg-white grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-100">
      {/* Left: Breadcrumb + New Task */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center h-7">
          <span className="font-normal text-xs leading-4 text-black">
            <Link to="/projects" className="hover:text-primary transition-colors">
              Project
            </Link>
            {" / "}
            <Link
              to={projectId ? `/projects/${projectId}` : "/projects"}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {projectName}
            </Link>
          </span>
        </nav>
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="bg-secondary border border-primary flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-primary font-medium text-xs leading-4 hover:bg-secondary/80 btn-hover"
          >
            <AddIcon />
            <span>New Task</span>
          </button>
        )}
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
