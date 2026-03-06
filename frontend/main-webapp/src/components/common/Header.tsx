import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

export function Header({ companyName, messageContents, notificationContents }: HeaderProps) {

  // MOCK DATA
  const currentUser = findUserById(105)

  const navigate = useNavigate()

  const { currentUser: currentAuthUser, setRole } = useAuth();

  // States management
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

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
      content: <ContentList data={messageContents} emptyLabel='No messages available' onItemClick={closeMenu} />
    },
    {
      id: 'noti',
      icon: <Notifications />,
      content: <ContentList data={notificationContents} emptyLabel='No notifications available' onItemClick={closeMenu} />
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

  return (
    <header className="flex items-center justify-between w-full px-3 py-1.5 transition-all duration-300 ease-in-out bg-white shadow-md border-b border-neutral-200">
      {/* Left side - Logo */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="text-primary h-7" />
        <p className="text-primary text-sm font-bold leading-tight">{companyName}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 text-neutral-500">

        {/* Dev Role Switcher */}
        <div className="flex items-center bg-neutral-100 rounded-full p-0.5 mr-1 border border-neutral-200">
          <button
            onClick={() => setRole(currentAuthUser.role === 'manager' ? 'employee' : 'manager')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${currentAuthUser.role === 'manager'
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
              }`}
          >
            MGR
          </button>
          <button
            onClick={() => setRole(currentAuthUser.role === 'employee' ? 'manager' : 'employee')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${currentAuthUser.role === 'employee'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
              }`}
          >
            EMP
          </button>
        </div>

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
        ))}

        {/* Avatar */}
        <Dropdown
          isOpen={activeMenu === 'profile'}
          trigger={
            <div
              onClick={() => toggleMenu('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-neutral-200 cursor-pointer element-hover"
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