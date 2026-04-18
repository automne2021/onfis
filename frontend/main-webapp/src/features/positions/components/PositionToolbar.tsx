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

const EMPLOYMENT_TYPE_CATEGORY: FilterCategory = {
  key: "employment_type",
  label: "Employment Type",
  options: [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
  ],
};

interface PositionToolbarProps {
  onFilter: (filters: ActiveFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  departments?: { id: string; name: string }[];
  activeFilters?: ActiveFilters;
  onSearchQueryChange?: (query: string) => void;
}

export default function PositionToolbar({
  viewMode,
  onViewModeChange,
  onFilter,
  departments = [],
  activeFilters = {},
  onSearchQueryChange,
}: PositionToolbarProps) {
  const { withTenant } = useTenantPath();
  const [activeMenu, setActiveMenu] = useState<string|null>(null) // 'filter' | 'search' | null
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const filterCategories: FilterCategory[] = [
    ...(departments.length > 0
      ? [{
          key: "department",
          label: "Department",
          options: departments.map((d) => ({ value: d.id, label: d.name })),
        }]
      : []),
    EMPLOYMENT_TYPE_CATEGORY,
  ];

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
              onQueryChange={onSearchQueryChange}
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
          categories={filterCategories}
          activeFilters={activeFilters}
          onFiltersChange={onFilter}
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
