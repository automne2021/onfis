import { SettingsOutlined } from '@mui/icons-material';
import { useState } from 'react';
import { ProfileCard } from '../../../../components/common/Card/ProfileCard';
import userProfileImg from "../../../../assets/images/user-profile-img.png";
import { StatusBubble } from '../../../../components/common/StatusBubble';
import { useAuth } from '../../../../hooks/useAuth';
import type { FullUserProfile } from '../../../../types/userType';

export function CurrentUserFooter() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Lấy dữ liệu user thật từ Supabase Auth Context
  const { user, isLoading } = useAuth();

  const handleOpenProfile = () => setIsProfileOpen(prev => !prev);

  if (isLoading) {
    return <div className="h-[72px] border-t border-neutral-200 animate-pulse bg-neutral-50 flex-shrink-0" />;
  }

  if (!user) return null; 

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Unknown User";
  const avatarUrl = user.user_metadata?.avatar_url || userProfileImg;
  const status = "online"; 

  const profileCardData: FullUserProfile = {
    id: user.id,
    firstName: "N/A",
    lastName: "N/A",
    positionName: user.user_metadata?.position || "N/A",
    departmentName: user.user_metadata?.department || "N/A",
    email: user.email || "N/A",
    avatarUrl: avatarUrl
  };

  return (
    <div className="border-t border-neutral-200 flex items-center justify-between py-4 px-5 flex-shrink-0 bg-white">
      
      {/* Cụm Avatar + Info */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className='relative'>
          <div 
            onClick={handleOpenProfile}
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
          <span className="body-2-medium text-neutral-900 truncate max-w-[130px]">
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
        onClick={() => console.log('Open User Settings')}
      >
        <SettingsOutlined fontSize="small" />
      </button>

    </div>
  );
}