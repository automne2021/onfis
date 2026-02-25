import type { OverviewProps } from "../../types/userProfileTypes";
import { 
  EmailOutlined,
  PhoneOutlined,
  BusinessOutlined,
} from '@mui/icons-material';
import { TitleHeader } from "../TitleHeader";
import { CopyArea } from "../Copy/CopyArea";

interface ContactProps extends OverviewProps {
  role?: string;
}

export function ContactInformation({ icon, userInfo, role } : ContactProps) {

  const formatAddress = (address?: { line1: string; cityStateZip: string; country: string }) => {
    if (!address) return undefined;
    return [address.line1, address.cityStateZip, address.country]
      .filter(Boolean)
      .join(', ');
  };

  const officeContactInfo = [
    {label: "Work Email", icon: <EmailOutlined />, content: userInfo.email},
    {label: "Work Phone Number", icon: <PhoneOutlined />, content: userInfo.phone},
    {label: "Office Location", icon: <BusinessOutlined />, content: userInfo.officeLocation},
  ]

  const personalContactInfo = [
    {label: "Personal Email", icon: <EmailOutlined />, content: userInfo.personalEmail},
    {label: "Personal Phone Number", icon: <PhoneOutlined />, content: userInfo.personalPhone},
    {label: "Home Address", icon: <BusinessOutlined />, content: formatAddress(userInfo.homeAddress)},
  ]

  const canViewPersonal = role === 'manager' || role === 'admin';

  return(
    <div className="bg-white rounded-lg py-10 px-6 flex flex-col gap-6 relative">
      <TitleHeader icon={icon} title="Contact Information" /> 

      <div className="flex flex-col gap-10">
        {/* Office Contact info */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {officeContactInfo.map((item, index) => (
            <div 
              key={index}
              className="flex flex-1 flex-col justify-center gap-2 min-w-[280px] px-4 py-3"
            >
              <p className="text-neutral-500 body-3-medium uppercase">{item.label}</p>
              <CopyArea icon={item.icon} index={index} content={item.content ? item.content : 'N/A'} />
            </div>
          ))}
        </div>

        {/* Personal Contact info */}
        {canViewPersonal && (
          <>
            <div className="w-full h-px bg-gray-100" /> 
            
            <div className="flex flex-wrap items-start gap-4">
              {personalContactInfo.map((item, index) => {
                {/* Home Address */}
                if (item.label === "Home Address") {
                  return (
                    <div 
                      key={`personal-${index}`} 
                      className="flex flex-1 flex-col justify-center gap-3 min-w-[320px] px-5 py-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <p className="text-neutral-500 body-3-medium uppercase">{item.label}</p>
                      
                      <div className="flex items-center justify-between gap-4">
                        {/* Text Address */}
                        <div className="flex flex-col body-3-regular text-neutral-800">
                          <span className="body-2-medium mb-1">
                            {userInfo.homeAddress?.line1 || "N/A"}
                          </span>
                          <span className="text-neutral-500">{userInfo.homeAddress?.cityStateZip}</span>
                          <span className="text-neutral-500">{userInfo.homeAddress?.country}</span>
                        </div>

                        {/* 2. Phần Thumbnail Bản đồ (có nút View) */}
                        {userInfo.homeAddress && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.content || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-[100px] h-[60px] rounded-md overflow-hidden group flex-shrink-0 cursor-pointer border border-gray-200"
                          >
                            {/* Dùng ảnh giả lập bản đồ, bạn có thể thay bằng ảnh map thực tế lấy từ dự án */}
                            <img 
                              src="https://www.google.com/maps/vt/pb=!1m4!1m3!1i15!2i5239!3i12692!2m3!1e0!2sm!3i42012048!3m7!2sen!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i1301875" 
                              alt="Map Thumbnail" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Nút View nằm đè lên trên */}
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover:bg-black/20 transition-all">
                               <span className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded shadow-sm">
                                 View
                               </span>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }

                {/* Else */}
                return (
                  <div 
                    key={`personal-${index}`}
                    className="flex flex-1 flex-col justify-center gap-2 min-w-[250px] px-4 py-3"
                  >
                    <p className="text-neutral-500 text-xs font-semibold uppercase">{item.label}</p>
                    <CopyArea icon={item.icon} index={index} content={item.content ? item.content : 'N/A'} />
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  )
}