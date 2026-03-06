import type { OverviewProps } from "../../types/userProfileTypes";
import {
  Flag,
  PersonOutline,

} from '@mui/icons-material';
import { IdCard } from 'lucide-react';
import { TitleHeader } from "../TitleHeader";

export function Identification({ icon, userInfo, role }: OverviewProps & { role?: string }) {
  const allowedRole = ['admin', 'hr']
  const canViewNationalId = role && allowedRole.includes(role.toLowerCase())

  const identificationInfo = [
    ...(canViewNationalId
      ? [{ label: "National ID (SSN)", icon: <IdCard fontSize="small" />, content: userInfo.nationalId }]
      : []
    ),
    { label: "Nationality", icon: <Flag fontSize="small" />, content: userInfo.nationality },
    { label: "Gender", icon: <PersonOutline fontSize="small" />, content: userInfo.gender },
  ]

  return (
    <div className="bg-white rounded-lg py-10 px-6 flex flex-col gap-6 relative">
      <TitleHeader icon={icon} title="Identification" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {identificationInfo.map((item, index) => (
          <div key={index} className="flex-1 min-w-[280px] flex flex-col gap-3 px-4 py-3 rounded-md bg-neutral-50">
            <div className="flex items-center gap-2 text-neutral-500 body-2-medium">
              {item.icon}
              {item.label}
            </div>
            <p className="body-1-medium text-neutral-900">
              {item.content ? item.content : 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}