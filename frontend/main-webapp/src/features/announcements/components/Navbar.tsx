import { useCallback, useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

import { FilterList } from '@mui/icons-material';

import Dropdown from "../../../components/common/Dropdown/Dropdown";
import { Button } from "../../../components/common/Buttons/Button";
import { ContentList, type ContentItem } from "../../../components/common/Dropdown/ContentList";
import { SearchBar, type SearchResult } from "../../../components/common/SearchBar";
import type { AnnouncementFilterOption } from "../types/AnnouncementTypes";
import { Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface NavbarProps {
  currentFilter?: AnnouncementFilterOption;
  onFilterChange?: (filter: AnnouncementFilterOption) => void;
}

export function Navbar({ currentFilter = 'newest', onFilterChange }: NavbarProps) {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { tenant } = useParams();
  console.log(tenant);

  const [activeMenu, setActiveMenu] = useState<string|null>(null) // 'filter' | 'search' | null
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  
  // Functions
  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId)
  }
  
  const closeMenu = () => setActiveMenu(null)
  
  const handleSearchResultClick = (url?: string) => {
    if (url) {
      navigate(`/${tenant}/${url}`);
    }
    closeMenu()
    setSearchResults([])
  }
  
  const searchContentItem: ContentItem[] = searchResults.slice(0,5).map(item => ({
    content: item.title,
    onClick: () => handleSearchResultClick(item.url)
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
    { content: renderFilterText(t("Newest First"), 'newest'), onClick: () => handleSelectFilter('newest') },
    { content: renderFilterText(t("Oldest First"), 'oldest'), onClick: () => handleSelectFilter('oldest') },
  ];

  return(
    <nav className="navbar-style">
      {/* Tên */}
      <p className="body-3-regular text-neutral-900">
        {t("Annoucement")}
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
            emptyLabel={isSearching ? t("Searching...") : t("No result available")}
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
            title={t("Filter")}
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