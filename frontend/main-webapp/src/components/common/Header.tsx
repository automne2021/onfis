import { useState } from 'react';

import { Chat, Notifications } from '@mui/icons-material';

import logo from "../../assets/logo-without-text.svg"
import userProfileImg from "../../assets/images/user-profile-img.png"
import { IconButton } from './IconButton';
import Dropdown from './Dropdown/Dropdown';
import { ContentList, type ContentItem } from './Dropdown/ContentList';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/auth';

interface HeaderProps {
  companyName: string
  messageContents?: ContentItem[] | null
  notificationContents?: ContentItem[] | null
}

export function Header({ companyName, messageContents, notificationContents }: HeaderProps) {
  const { currentUser: authUser } = useAuth();
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
  const avatarImg = authUser.avatar || userProfileImg
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
          navigate(`/${tenant}/profile/${authUser.id || 105}`)
        }
      }
    },
    {
      content: "Settings",
      onClick: () => console.log("Settings")
    },
    {
      content: "Log out",
      onClick: async () => {
        try {
          await signOut();
        } catch (error) {
          console.warn("Failed to sign out", error);
        } finally {
          closeMenu();
          if (tenant) {
            navigate(`/${tenant}/auth/login`);
          }
        }
      }
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