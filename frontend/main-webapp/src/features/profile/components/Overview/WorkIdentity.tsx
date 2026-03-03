import type { OverviewProps } from "../../types/userProfileTypes";
import avatarImg from "../../../../assets/images/user-profile-img.png"
import { useState } from "react";
import { ProfileCard } from "../../../../components/common/Card/ProfileCard";
import { findUserById } from "../../../../data/mockUserData";
import type { UserProfile } from "../../../../types/userType";

export function WorkIdentity({ icon, userInfo } : OverviewProps) {
  // Đưa useState lên đầu cho đúng chuẩn React Hooks
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if(!userInfo) return <div className="body-2-regular text-neutral-500">No user available!</div>

  const managerProfile = userInfo.reportsTo ? findUserById(userInfo.reportsTo) : undefined;
  const managerName = managerProfile?.name || userInfo.reportsToName || 'N/A';
  const managerAvatar = managerProfile?.avatarUrl || userInfo.reportsToAvatar || avatarImg;

  const workIdentityItems = [
    { label: 'Job title', content: userInfo?.position || 'N/A' },
    { label: 'Team', content: userInfo?.team || 'N/A' },
    { 
      label: 'Reports to', 
      content: managerName, 
      avatarUrl: managerAvatar,
      isClickable: true 
    },
    { label: 'Location', content: userInfo?.officeLocation || userInfo?.location || 'N/A' },
  ]

  const profileCardData: UserProfile = managerProfile || {
    id: "unknown",
    name: managerName,
    position: "Manager",
    department: "Company",
    email: "unknown@company.com",
    avatarUrl: managerAvatar
  };

  const togglePersonalInformationCard = () => {
    setIsProfileOpen(prev => !prev)
  }

  return(
    <div className="bg-white rounded-lg py-10 px-6 flex flex-col gap-6 relative">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="header-h6 leading-none text-neutral-900">Work Identity</p>
      </div>

      <div className="flex items-center justify-between">
        {workIdentityItems.map((item, index) => (
          <div 
            key={index}
            className="flex flex-1 flex-col gap-1.5"
          >
            <p className="text-neutral-500 body-3-medium uppercase ml-2">
              {item.label}
            </p>
            <div 
              onClick={item.isClickable ? togglePersonalInformationCard : undefined}
              className={`flex items-center gap-2 p-2 
                ${item.isClickable ? 'rounded-sm hover:bg-neutral-50 cursor-pointer transition' : '' }
              `}
            >
              {item.avatarUrl && item.isClickable && (
                <img 
                  src={item.avatarUrl} 
                  alt={`Manager Avatar`} 
                  className="w-6 h-6 rounded-full object-cover border border-neutral-200"
                />
              )}
              <p className="text-neutral-900 body-3-regular">
                {item.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isProfileOpen && (
        <div className="absolute top-1/2 left-[50%] z-50 mt-2 shadow-lg">
          <ProfileCard 
            user={profileCardData} 
            onClose={() => setIsProfileOpen(false)} 
          />
        </div>
      )}
    </div>
  )
}