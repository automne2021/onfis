import { SettingsOutlined } from '@mui/icons-material';
import { useState } from 'react';
import { ProfileCard } from '../../../../components/common/Card/ProfileCard';
import { CURRENT_USER } from '../../../../data/mockChatData';
import { findUserById } from '../../../../data/mockUserData';
import type { UserProfile } from '../../../../types/userType';
import userProfileImg from "../../../../assets/images/user-profile-img.png"
import { StatusBubble } from '../StatusBubble';

interface CurrentUserFooterProps {
  name: string;
  avatarUrl: string;
  status?: "online" | "busy" | "offline"
}

export function CurrentUserFooter({ name, avatarUrl, status="offline" }: CurrentUserFooterProps) {

  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const currentUser: UserProfile | undefined = findUserById(CURRENT_USER.id)
  const profileCardData: UserProfile = currentUser || {
    id: "unknown",
    name: "N/A",
    position: "N/A",
    department: "Company",
    email: "unknown@company.com",
    avatarUrl: userProfileImg
  };

  const handleOpenProfile = () => setIsProfileOpen(prev => !prev)

  return (
    <div className="border-t border-neutral-200 flex items-center justify-between py-4 px-5 flex-shrink-0">
      
      {/* Cụm Avatar + Info */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className='relative'>
          <div 
            onClick={() => handleOpenProfile()}
            className="relative w-9 h-9 rounded-full"
          >
            <img src={avatarUrl} alt="Current User" className="w-full h-full object-cover rounded-full" />
            <StatusBubble status={status} />
          </div>

          {isProfileOpen && (
            <ProfileCard
              onClose={handleOpenProfile}
              user={profileCardData}
            />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="body-2-medium text-neutral-900">
            {name}
          </span>
          <span className="body-4-regular text-neutral-500 capitalize">
            {status}
          </span>
        </div>
      </div>

      {/* Nút Settings */}
      <button 
        type='button'
        className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-full transition"
      >
        <SettingsOutlined fontSize="small" />
      </button>

    </div>
  );
}