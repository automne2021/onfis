import type { ReactElement } from "react";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { SearchIcon, KanbanIcon, ListIcon, TimelineIcon, CalendarViewIcon as CalendarIcon } from "../../../components/common/Icons";
import { Button } from "../../../components/common/Buttons/Button";
import { useLanguage } from "../../../contexts/LanguageContext";

import { Add } from '@mui/icons-material';
import { ViewToggle } from "../../../components/common/ViewToggle";

type ViewMode = "kanban" | "list" | "timeline" | "calendar";

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
  const { t } = useLanguage();

  const FILTER_CATEGORIES: FilterCategory[] = [
    {
      key: "status",
      label: t("Status"),
      options: [
        { value: "planning", label: t("Planning") },
        { value: "in_progress", label: t("In Progress") },
        { value: "on_hold", label: t("On Hold") },
        { value: "completed", label: t("Completed") },
      ],
    },
    {
      key: "priority",
      label: t("Priority"),
      options: [
        { value: "urgent", label: t("Urgent"), color: "bg-[#E7000B]" },
        { value: "high", label: t("High"), color: "bg-[#FF6900]" },
        { value: "medium", label: t("Medium"), color: "bg-[#FFD230]" },
        { value: "low", label: t("Low"), color: "bg-neutral-400" },
      ],
    },
  ];

  const viewModes: { mode: ViewMode; icon: (active: boolean) => ReactElement }[] = [
    { mode: "kanban", icon: (active) => <KanbanIcon active={active} /> },
    { mode: "list", icon: (active) => <ListIcon active={active} /> },
    { mode: "timeline", icon: (active) => <TimelineIcon active={active} /> },
    { mode: "calendar", icon: (active) => <CalendarIcon active={active} /> },
  ];

  return (
    <nav className="navbar-style">
      {/* Left: Breadcrumb + New Project */}
      <p className="body-3-regular text-neutral-900">{t("Project")}</p>

      {/* Center: Search */}
      <div className={`flex gap-2 items-center px-4 py-2 border bg-white border-neutral-200 outline-none rounded-full transition-colors duration-200 focus-within:border-primary focus-within:bg-white w-[260px] lg:w-[380px]`}>
        <SearchIcon />
        <input
          type="text"
          placeholder={t("Search...")}
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
            title={t("New Project")}
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
