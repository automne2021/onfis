import { useState } from "react";


import Dropdown from "../../../components/common/Dropdown/Dropdown";
import { FilterButton } from "../../../components/common/Buttons/FilterButton";
import { ContentList, type ContentItem } from "../../../components/common/Dropdown/ContentList";

export function Navbar() {

  // States management
  const [activeMenu, setActiveMenu] = useState<string|null>(null)

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

  return(
    <nav className="navbar-style">
      {/* Tên */}
      <p className="text-body-1-regular text-neutral-900">
        Annoucement
      </p>

      {/* Search bar */}


      {/* Filter */}
      <Dropdown 
        isOpen={activeMenu === 'filter'}
        trigger={
          <FilterButton
            onClick={() => toggleMenu('filter')}
          />
        }
        children={<ContentList data={filterContents} emptyLabel="" onItemClick={closeMenu}/>}
      />
      
    </nav>
  );
}