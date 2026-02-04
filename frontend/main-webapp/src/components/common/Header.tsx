import { useState } from 'react';

import { Chat, Notifications } from '@mui/icons-material';

import logo from "../../assets/logo-without-text.svg"
import userProfileImg from "../../assets/images/user-profile-img.png"
import { IconButton } from './IconButton';
import Dropdown from './Dropdown/Dropdown';
import { ContentList } from './Dropdown/ContentList';

interface HeaderProps {
  companyName: string
  userImg?: string
  messageContents?: string[] | null
  notificationContents?: string[] | null
}


export function Header({ companyName, userImg, messageContents, notificationContents }: HeaderProps){
  // Data 
  const avatarImg = userImg? userImg : userProfileImg
  const iconButtons = [
    {
      id: 'chat',
      icon: <Chat />,
      content: <ContentList data={messageContents} emptyLabel='No messages available' />
    }, 
    {
      id: 'noti',
      icon: <Notifications />,
      content: <ContentList data={notificationContents} emptyLabel='No notifications available' />
    }
  ] 
  const profileContents = ["User Profile", "Settings", "Log out"]

  // States management
  const [activeMenu, setActiveMenu] = useState<string|null>(null)

  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId)
  }

  return(
    <header className="fixed top-0 z-50 flex items-center justify-between w-full h-[60px] px-4 md:px-5 xl:px-8 2xl:px-[220px] py-4 transition-all duration-300 ease-in-out bg-neutral-50 shadow-md shadow-neutral-200">
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
          children={<ContentList data={profileContents} emptyLabel=''/>}
          widthClass='w-32'
        />
      </div>

    </header>
  );
}