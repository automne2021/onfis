import type { OverviewProps } from "../../types/userProfileTypes";
import {
  WorkspacePremium,
  DomainOutlined,
  CalendarMonthOutlined
} from '@mui/icons-material';
import { TitleHeader } from "../TitleHeader";

export function Education({ icon, userInfo }: OverviewProps) {

  const educationInfo = [
    { label: 'Highest Degree', icon: <WorkspacePremium />, content: userInfo.education?.degree, subcontent: userInfo.education?.major },
    { label: 'Institution', icon: <DomainOutlined />, content: userInfo.education?.institution },
    { label: 'Graduation year', icon: <CalendarMonthOutlined />, content: userInfo.education?.graduationYear },
  ]

  return (
    <div className="bg-white rounded-lg py-10 px-6 flex flex-col gap-6 relative">
      <TitleHeader icon={icon} title="Education" />

      <div className="flex flex-wrap items-stretch justify-between gap-3">
        {educationInfo.map((item, index) => (
          <div
            key={index}
            className="flex flex-1 flex-col gap-3 px-4 py-3 min-w-[280px] rounded-md border border-neutral-200"
          >
            <p className="uppercase body-3-medium text-neutral-500">{item.label}</p>
            <div className="flex items-center gap-3">
              <div className="bg-secondary text-primary p-3 rounded-full flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-neutral-900 body-2-medium">{item.content}</p>
                {item.subcontent && <p className="text-neutral-500 body-3-regular">{item.subcontent}</p>}
              </div>
            </div>
          </div>
        ))}

      </div>

    </div>
  )
}