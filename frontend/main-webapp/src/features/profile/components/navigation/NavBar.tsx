import { useCallback, useState } from "react";
import { ContentList, type ContentItem } from "../../../../components/common/Dropdown/ContentList";
import Dropdown from "../../../../components/common/Dropdown/Dropdown";
import { SearchBar, type SearchResult } from "../../../../components/common/SearchBar";
import { Button } from "../../../../components/common/Buttons/Button";
import { UploadFileOutlined } from '@mui/icons-material';

export function NavBar() {

  // States management
  const [activeMenu, setActiveMenu] = useState<string|null>(null) // Dành riêng cho dropdown/search
  const [activeFilter, setActiveFilter] = useState<string>("all") // Dành riêng cho bộ lọc, mặc định là 'all'
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  // Data
  const filterButtons = [
    {id: "all", label: "All Files"},
    {id: "contracts", label: "Contracts"},
    {id: "identification", label: "Identifications"},
  ]

  // Functions
  const toggleFilter = (filterId: string) => {
    setActiveFilter(prev => prev === filterId ? 'all' : filterId)
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

  const handleUploadDocument = () => {}

  return(
    <div className="my-3 flex items-center justify-between">
      {/* Left */}
      <div className="flex item-center gap-3">
        {/* Search bar */}
        <Dropdown
          isOpen={activeMenu === 'search'}
          trigger={
            <div onClick={() => setActiveMenu(activeMenu === 'search' ? null : 'search')}>
              <SearchBar 
                scope="documents" 
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
        
        {/* Filtered buttons */}
        {filterButtons.map((item) => {
          const isActive = activeFilter === item.id;
          return (
            <Button 
              key={item.id}
              id={item.id}
              title={item.label}
              onClick={() => toggleFilter(item.id)} 
              style='custom'
              bgColor={isActive ? "bg-primary" : "bg-white"}
              bgHoverColor={isActive ? "bg-primary/90" : "bg-neutral-50"} 
              textColor={isActive ? "text-white" : "text-neutral-500"}
              borderColor={isActive ? "border-primary" : "border-neutral-300"}
              type="button"
            />
          );
        })}
      </div>

      {/* Right */}
      <Button
        id="upload"
        title="Upload New Document"
        iconLeft={<UploadFileOutlined />}
        onClick={() => handleUploadDocument()}
        style='primary'
        type="button"
      />
    </div>
  )
}