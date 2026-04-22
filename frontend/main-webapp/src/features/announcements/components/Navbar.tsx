import { useCallback, useState } from "react";

import { FilterList } from '@mui/icons-material';

import Dropdown from "../../../components/common/Dropdown/Dropdown";
import { Button } from "../../../components/common/Buttons/Button";
import { ContentList, type ContentItem } from "../../../components/common/Dropdown/ContentList";
import { SearchBar, type SearchResult } from "../../../components/common/SearchBar";
import type { AnnouncementFilterOption } from "../types/AnnouncementTypes";
import { Check } from "lucide-react";

interface NavbarProps {
  currentFilter?: AnnouncementFilterOption;
  onFilterChange?: (filter: AnnouncementFilterOption) => void;
}

export function Navbar({ currentFilter = 'newest', onFilterChange }: NavbarProps) {

  const [activeMenu, setActiveMenu] = useState<string|null>(null) // 'filter' | 'search' | null
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  
  // Functions
  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId)
  }
  
  const closeMenu = () => setActiveMenu(null)
  
  const handleSearchResultClick = () => {
    closeMenu()
    setSearchResults([])
  }
  
  const searchContentItem: ContentItem[] = searchResults.slice(0,5).map(item => ({
    content: item.title,
    onClick: () => handleSearchResultClick()
  }))

  const handleSearchData = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  const handleSelectFilter = (opt: AnnouncementFilterOption) => {
    if (onFilterChange) onFilterChange(opt);
    closeMenu();
  };

  const renderFilterText = (label: string, opt: AnnouncementFilterOption) => (
    <div className="flex items-center justify-between w-full">
      <span className={currentFilter === opt ? "font-medium text-primary" : ""}>{label}</span>
      {currentFilter === opt && <Check fontSize="small" className="text-primary" />}
    </div>
  );

  const filterContents: ContentItem[] = [
    { content: renderFilterText("Newest First", 'newest'), onClick: () => handleSelectFilter('newest') },
    { content: renderFilterText("Oldest First", 'oldest'), onClick: () => handleSelectFilter('oldest') },
  ];

  return(
    <nav className="navbar-style">
      {/* Tên */}
      <p className="body-3-regular text-neutral-900">
        Annoucement
      </p>

      {/* Search bar */}
      <Dropdown
        isOpen={activeMenu === 'search' && searchQuery.trim().length > 0}
        trigger={
          <div onClick={() => setActiveMenu('search')}>
            <SearchBar 
              scope="announcement" 
              onSearch={handleSearchData}
              onQueryChange={setSearchQuery} 
              onIsSearchingChange={setIsSearching}
            />
          </div>
        }
        children={
          <ContentList 
            data={searchContentItem}
            emptyLabel={isSearching ? "Searching..." : "No result available"}
            onItemClick={closeMenu}
          />
        }
        widthClass="w-full"
        onClose={closeMenu}
      />

      {/* Filter */}
      <Dropdown 
        isOpen={activeMenu === 'filter'}
        trigger={
          <Button
            title="Filter"
            iconLeft={<FilterList sx={{ fontSize: 16 }}/>}
            onClick={() => toggleMenu('filter')}
            style='sub'
            textStyle="body-4-medium"
          />
        }
        children={<ContentList data={filterContents} emptyLabel="" onItemClick={closeMenu}/>}
        onClose={() => setActiveMenu(null)}
      />
      
    </nav>
  );
}