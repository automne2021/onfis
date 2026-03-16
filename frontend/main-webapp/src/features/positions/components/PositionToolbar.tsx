import { useCallback, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { TreeViewIcon, ListViewIcon } from "../../../components/common/Icons";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { Dropdown } from "../../../components/common";
import { SearchBar, type SearchResult } from "../../../components/common/SearchBar";
import { ContentList, type ContentItem } from "../../../components/common/Dropdown/ContentList";
import { ViewToggle } from "../../../components/common/ViewToggle";

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
  onFilter: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function PositionToolbar({
  viewMode,
  onViewModeChange,
}: PositionToolbarProps) {
  const { withTenant } = useTenantPath();
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [activeMenu, setActiveMenu] = useState<string|null>(null) // 'filter' | 'search' | null
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const viewModes: { mode: ViewMode; icon: (active: boolean) => ReactElement }[] = [
      { mode: "tree", icon: (active) => <TreeViewIcon active={active} /> },
      { mode: "list", icon: (active) => <ListViewIcon active={active} /> },
    ];

  const closeMenu = () => setActiveMenu(null)

  const handleSearchResultClick = (item: SearchResult) => {
    console.log("Navigate to: ", item.url)
    // Can use router.push(item.url)
    closeMenu()
    setSearchResults([])
  }

  const searchContentItem: ContentItem[] = searchResults.slice(0,5).map(item => ({
    content: item.title,
    onClick: () => handleSearchResultClick(item)
  }))

  const handleSearchData = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  return (
    <div className="navbar-style">
      {/* Left: Breadcrumb */}
      <Link to={withTenant("/positions")} className="body-3-regular text-neutral-900 hover:text-primary transition-colors">
        Position
      </Link>

      {/* Center: Search */}
      <Dropdown
        isOpen={activeMenu === 'search'}
        trigger={
          <div onClick={() => setActiveMenu('search')}>
            <SearchBar 
              scope="positions" 
              onSearch={handleSearchData}
            />
          </div>
        }
        children={
          <ContentList 
            data={searchContentItem}
            emptyLabel="No result available"
            onItemClick={closeMenu}
          />
        }
        widthClass="w-full"
        onClose={closeMenu}
      />

      {/* Right: Filter + View Toggle */}
      <div className="flex items-center gap-2">
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
    </div>
  );
}
