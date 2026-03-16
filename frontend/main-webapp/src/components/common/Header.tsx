import { useState } from 'react';

import { Chat, Notifications } from '@mui/icons-material';

import logo from "../../assets/logo-without-text.svg"
import userProfileImg from "../../assets/images/user-profile-img.png"
import { IconButton } from './IconButton';
import Dropdown from './Dropdown/Dropdown';
import { ContentList, type ContentItem } from './Dropdown/ContentList';
import { findUserById } from '../../data/mockUserData';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  companyName: string
  messageContents?: ContentItem[] | null
  notificationContents?: ContentItem[] | null
}

export function Header({ companyName, messageContents, notificationContents }: HeaderProps) {

  // MOCK DATA
  const currentUser = findUserById(105)
  const { currentUser: authUser, toggleRole } = useAuth();
  const { tenant } = useParams<{ tenant: string }>();

  const navigate = useNavigate()

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
        if (tenant) {
          navigate(`/${tenant}/profile/${currentUser?.id || 105}`)
        }
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

        {/* Role toggle — dev/demo only */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={toggleRole}
            title={`Currently: ${authUser.role}. Click to switch.`}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors cursor-pointer select-none ${
              authUser.role === "MANAGER"
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {authUser.role === "MANAGER" ? "Manager" : "Employee"}
          </button>
        )}

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