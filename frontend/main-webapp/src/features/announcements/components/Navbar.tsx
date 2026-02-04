import { useState } from "react";


import Dropdown from "../../../components/common/Dropdown/Dropdown";

export function Navbar() {

  // States management
  const [activeMenu, setActiveMenu] = useState<string|null>(null)

  // Data
  const filterContents = [
    "ABC", "XYZ", "Điền", "sau", "nhé"
  ]

  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId)
  }

  return(
    <nav className="navbar-style">
      {/* Tên */}
      <p className="text-body-1-regular text-neutral-900">
        Annoucement
      </p>

      {/* Search bar */}


      {/* Filter */}
      {/* <Dropdown 
        isOpen={activeMenu === 'filter'}
        trigger={
          < 
            onClick={() => toggleMenu('filter')}
          />
        }
        children={filterContents}
      /> */}
      
    </nav>
  );
}