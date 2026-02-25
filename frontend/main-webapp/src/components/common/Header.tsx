import { useState } from 'react';

import { Chat, Notifications } from '@mui/icons-material';

import logo from "../../assets/logo-without-text.svg"
import userProfileImg from "../../assets/images/user-profile-img.png"
import { IconButton } from './IconButton';
import Dropdown from './Dropdown/Dropdown';
import { ContentList, type ContentItem } from './Dropdown/ContentList';
import { findUserById } from '../../data/mockUserData';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  companyName: string
  messageContents?: ContentItem[] | null
  notificationContents?: ContentItem[] | null
}

export function Header({ companyName, messageContents, notificationContents }: HeaderProps){

  // MOCK DATA
  const currentUser = findUserById(105)

  const navigate = useNavigate()
  
  // States management
  const [activeMenu, setActiveMenu] = useState<string|null>(null)

  // Functions
  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId)
  }

  const closeMenu = () => setActiveMenu(null); 

  // Data 
  const avatarImg = currentUser?.avatarUrl ? currentUser.avatarUrl : userProfileImg
  const iconButtons = [
    {
      id: 'chat',
      icon: <Chat />,
      content: <ContentList data={messageContents} emptyLabel='No messages available' onItemClick={closeMenu}/>
    }, 
    {
      id: 'noti',
      icon: <Notifications />,
      content: <ContentList data={notificationContents} emptyLabel='No notifications available' onItemClick={closeMenu}/>
    }
  ] 
  const profileContents: ContentItem[] = [
    {
      content: "User Profile",
      onClick: () => {
        closeMenu()
        console.log("User profile")
        navigate(`/profile/${currentUser?.id || 105}`)
      }
    }, 
    {
      content: "Settings",
      onClick: () => console.log("Settings")
    }, 
    {
      content: "Log out",
      onClick: () => console.log("Log out")
    }, 
  ]

  return(
    <header className="fixed top-0 z-50 flex items-center justify-between w-full h-[60px] px-4 md:px-5 xl:px-8 2xl:px-[220px] py-4 transition-all duration-300 ease-in-out bg-white shadow-md shadow-neutral-200">
      {/* Left side - Logo */}
      <div className="flex items-center gap-4">
        <img src={logo} alt="Logo" className="text-primary"/>
        <p className={`text-primary header-h6`}>{companyName}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 text-neutral-500">
        
        {/* Icons */}
        {iconButtons.map((item) => (
          <Dropdown
            key={item.id}
            isOpen={activeMenu === item.id}
            trigger={
              <IconButton 
                icon={item.icon} 
                onClick={() => toggleMenu(item.id)}
              />
            }
            children={item.content}
            onClose={() => setActiveMenu(null)}
          />
        )) }

        {/* Avatar */}
        <Dropdown 
          isOpen={activeMenu === 'profile'}
          trigger={
            <div 
              onClick={() => toggleMenu('profile')}
              className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src={avatarImg}
                alt="User Avatar"
                className="w-full h-full object-cover"
                />
            </div>
          }
          children={
            <ContentList 
              data={profileContents} 
              emptyLabel=''
              onItemClick={closeMenu}
            />
          }
          widthClass='w-32'
          onClose={() => setActiveMenu(null)}
        />
      </div>

    </header>
  );
}