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
  EyeIcon,
} from "../../../components/common/Icons";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { Button } from "../../../components/common/Buttons/Button";
import { ViewToggle } from "../../../components/common/ViewToggle";

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
  projectTitle: string;
  projectId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask?: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TaskToolbar({
  projectTitle,
  projectId,
  searchQuery,
  onSearchChange,
  // onNewTask,
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
    <nav className="navbar-style">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1 body-3-regular flex-shrink-0">
        <Link to="/projects" className="hover:text-primary transition-colors">
          Project
        </Link>
        <span className="mx-1">/</span>
        <Link
          to={projectId ? `/projects/${projectId}` : "/projects"}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          {projectTitle}
        </Link>
      </div>

      {/* Center: Search */}
      <div className={`flex gap-2 items-center px-4 py-2 border bg-white border-neutral-200 outline-none rounded-full transition-colors duration-200 focus-within:border-primary focus-within:bg-white w-[260px] lg:w-[380px] flex-shrink-0`}>
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

      {/* Right: View Project Detail + Filter + View Toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to={projectId ? `/projects/${projectId}` : "/projects"}>
          <Button
            title="View Project Detail"
            iconLeft={<EyeIcon />}
            style="sub"
            textStyle='body-4-medium'
          />
        </Link>
        {/* <Button
          title="New Task"
          iconLeft={<Add fontSize="small" />}
          onClick={onNewTask}
          style="primary"
          textStyle='body-4-medium'
        /> */}
        <FilterDropdown
          categories={FILTER_CATEGORIES}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
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
