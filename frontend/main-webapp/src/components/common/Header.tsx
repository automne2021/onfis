import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chat, Notifications } from '@mui/icons-material';

import logo from '../../assets/logo-without-text.svg';
import userProfileImg from '../../assets/images/user-profile-img.png';
import { IconButton } from './IconButton';
import Dropdown from './Dropdown/Dropdown';
import { ContentList, type ContentItem } from './Dropdown/ContentList';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/auth';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
  companyName: string;
  logoUrl?: string;
  messageContents?: ContentItem[] | null;
  notificationContents?: ContentItem[] | null;
}

export function Header({ companyName, logoUrl }: HeaderProps) {
  const { dbUser: authUser } = useAuth();
  const { tenant } = useParams<{ tenant: string }>();
  const navigate = useNavigate();
  const { 
    chatNotifs, 
    announcementNotifs, 
    unreadChatCount, 
    unreadAnnouncementCount 
  } = useNotifications();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = useCallback((menuId: string) => {
    setActiveMenu((prev) => (prev === menuId ? null : menuId));
  }, []);

  const closeMenu = useCallback(() => setActiveMenu(null), []);

  const avatarImg = authUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.name || '')}&background=random` || userProfileImg;

  const iconButtons = useMemo(
    () => [
      {
        id: 'chat',
        icon: (
          <div className="relative">
            <Chat fontSize='small'/>
            {unreadChatCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </div>
        ),
        content: (
          <ContentList data={chatNotifs} emptyLabel="No new messages" onItemClick={closeMenu} />
        ),
      },
      {
        id: 'noti',
        icon: (
          <div className="relative">
            <Notifications fontSize='small'/>
            {unreadAnnouncementCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                {unreadAnnouncementCount > 99 ? '99+' : unreadAnnouncementCount}
              </span>
            )}
          </div>
        ),
        content: (
          <ContentList
            data={announcementNotifs}
            emptyLabel="No new announcements"
            onItemClick={closeMenu}
          />
        ),
      },
    ],
    [chatNotifs, announcementNotifs, unreadChatCount, unreadAnnouncementCount, closeMenu]
  );

  const profileContents: ContentItem[] = useMemo(
    () => [
      {
        content: 'User Profile',
        onClick: () => {
          closeMenu();
          if (tenant && authUser?.id) {
            navigate(`/${tenant}/profile/${authUser.id}`);
          }
        },
      },
      {
        content: 'Settings',
        onClick: () => {
          closeMenu();
          console.log('Settings');
        },
      },
      {
        content: 'Log out',
        onClick: async () => {
          try {
            await signOut();
          } catch (error) {
            console.warn('Failed to sign out', error);
          } finally {
            closeMenu();
            if (tenant) {
              navigate(`/${tenant}/auth/login`);
            }
          }
        },
      },
    ],
    [tenant, authUser?.id, navigate, closeMenu]
  );

  return (
    <header className="flex items-center justify-between w-full px-3 py-1.5 transition-all duration-300 ease-in-out bg-white shadow-md border-b border-neutral-200">
      {/* Left side - Logo */}
      <div className="flex items-center gap-3">
        <img src={logoUrl || logo} alt="Logo" className="text-primary h-10" />
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
              <IconButton icon={item.icon} onClick={() => toggleMenu(item.id)} />
            }
            children={item.content}
            onClose={closeMenu}
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
            <ContentList data={profileContents} emptyLabel="" onItemClick={closeMenu} />
          }
          widthClass="w-32"
          onClose={closeMenu}
        />
      </div>
    </header>
  );
}
