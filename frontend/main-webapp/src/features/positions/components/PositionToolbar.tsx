import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchIcon, TreeViewIcon, ListViewIcon } from "../../../components/common/Icons";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";

type ViewMode = "tree" | "list";

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    key: "department",
    label: "Department",
    options: [
      { value: "marketing", label: "Marketing" },
      { value: "it", label: "IT" },
      { value: "finance", label: "Finance" },
      { value: "hr", label: "Human Resources" },
    ],
  },
  {
    key: "employment_type",
    label: "Employment Type",
    options: [
      { value: "full-time", label: "Full-time" },
      { value: "part-time", label: "Part-time" },
      { value: "contract", label: "Contract" },
    ],
  },
];

interface PositionToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function PositionToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: PositionToolbarProps) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  return (
    <div className="bg-white grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-300">
      {/* Left: Breadcrumb */}
      <Link to="/positions" className="text-xs font-normal text-black hover:text-primary transition-colors">
        Position
      </Link>

      {/* Center: Search */}
      <div className="justify-self-center">
        <div className="bg-white border border-neutral-200 rounded-[8px] flex items-center gap-1.5 px-2 py-1 min-w-[260px] lg:min-w-[380px]">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-neutral-900 text-xs placeholder:text-neutral-400"
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
          <button
            onClick={() => onViewModeChange("tree")}
            className={`p-1.5 transition-colors ${viewMode === "tree"
              ? "bg-primary"
              : "bg-neutral-200 hover:bg-neutral-200/80"
              }`}
            aria-label="Tree View"
          >
            <TreeViewIcon active={viewMode === "tree"} />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 transition-colors ${viewMode === "list"
              ? "bg-primary"
              : "bg-neutral-200 hover:bg-neutral-200/80"
              }`}
            aria-label="List View"
          >
            <ListViewIcon active={viewMode === "list"} />
          </button>
        </div>
      </div>
    </div>
  );
}
