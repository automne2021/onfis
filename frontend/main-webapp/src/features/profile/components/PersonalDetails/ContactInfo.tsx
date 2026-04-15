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

export function ContactInformation({ icon, userInfo, role }: ContactProps) {
  const displayAddress = userInfo.address || "N/A";

  const officeContactInfo = [
    { label: "Work Email", icon: <EmailOutlined />, content: userInfo.email },
    { label: "Work Phone Number", icon: <PhoneOutlined />, content: userInfo.workPhone },
    { label: "Office Location", icon: <BusinessOutlined />, content: userInfo.workLocation },
  ]

  const personalContactInfo = [
    { label: "Personal Email", icon: <EmailOutlined />, content: userInfo.personalEmail },
    { label: "Personal Phone Number", icon: <PhoneOutlined />, content: userInfo.phoneNumber },
    { label: "Home Address", icon: <BusinessOutlined />, content: displayAddress },
  ]

  const canViewPersonal = role === 'manager' || role === 'admin';

  return (
    <div className="profile-section">
      <TitleHeader icon={icon} title="Contact Information" />
      <div className="flex flex-col gap-10">
        {/* Office Contact info */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {officeContactInfo.map((item, index) => (
            <div key={index} className="flex flex-1 flex-col justify-center gap-2 min-w-[280px] px-4 py-3">
              <p className="text-neutral-500 body-3-medium uppercase">{item.label}</p>
              <CopyArea icon={item.icon} index={index} content={item.content || 'N/A'} />
            </div>
          ))}
        </div>

        {/* Personal Contact info */}
        {canViewPersonal && (
          <>
            <div className="w-full h-px bg-gray-100" />
            <div className="flex flex-wrap items-start gap-4">
              {personalContactInfo.map((item, index) => {
                if (item.label === "Home Address") {
                  return (
                    <div key={`personal-${index}`} className="flex flex-1 flex-col justify-center gap-3 min-w-[320px] px-5 py-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-neutral-500 body-3-medium uppercase">{item.label}</p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col body-3-regular text-neutral-800">
                          {/* HIỂN THỊ DẠNG STRING ĐƠN GIẢN */}
                          <span className="body-2-medium text-neutral-800">
                            {item.content}
                          </span>
                        </div>

                        {item.content !== "N/A" && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.content || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-[100px] h-[60px] rounded-md overflow-hidden group flex-shrink-0 border border-gray-200"
                          >
                            <img src="https://www.google.com/maps/vt/pb=!1m4!1m3!1i15!2i5239!3i12692!2m3!1e0!2sm!3i42012048!3m7!2sen!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i1301875" alt="Map" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover:bg-black/20">
                              <span className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded shadow-sm">View</span>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={`personal-${index}`} className="flex flex-1 flex-col justify-center gap-2 min-w-[250px] px-4 py-3">
                    <p className="text-neutral-500 text-xs font-semibold uppercase">{item.label}</p>
                    <CopyArea icon={item.icon} index={index} content={item.content || 'N/A'} />
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