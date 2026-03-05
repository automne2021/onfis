import { useCallback, useState } from "react";

import { FilterList } from '@mui/icons-material';

import Dropdown from "../../../components/common/Dropdown/Dropdown";
import { Button } from "../../../components/common/Buttons/Button";
import { ContentList, type ContentItem } from "../../../components/common/Dropdown/ContentList";
import { SearchBar, type SearchResult } from "../../../components/common/SearchBar";

export function Navbar() {

  // States management
  const [activeMenu, setActiveMenu] = useState<string|null>(null) // 'filter' | 'search' | null
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  // Data
  const filterContents: ContentItem[] = [
    {
      content: "ABC",
      onClick: () => console.log("Filter Item 1")
    },
    {
      content: "Filter 2",
      onClick: () => console.log("Filter Item 2")
    },
    {
      content: "Filter 3",
      onClick: () => console.log("Filter Item 3")
    },
  ]

  // Functions
  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId)
  }

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

  return(
    <nav className="navbar-style">
      {/* Tên */}
      <p className="text-body-1-regular text-neutral-900">
        Annoucement
      </p>

      {/* Search bar */}
      <Dropdown
        isOpen={activeMenu === 'search'}
        trigger={
          <div onClick={() => setActiveMenu('search')}>
            <SearchBar 
              scope="announcement" 
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

      {/* Filter */}
      <Dropdown 
        isOpen={activeMenu === 'filter'}
        trigger={
          <Button
            title="Filter"
            iconLeft={<FilterList fontSize="small"/>}
            onClick={() => toggleMenu('filter')}
            style='sub'
            textStyle="body-3-medium"
          />
        }
        children={<ContentList data={filterContents} emptyLabel="" onItemClick={closeMenu}/>}
        onClose={() => setActiveMenu(null)}
      />
      
    </nav>
  );
}