import type { OverviewProps } from "../../types/userProfileTypes";
import { TitleHeader } from "../TitleHeader";
import {
  PhoneOutlined,
} from '@mui/icons-material';
import { CopyArea } from "../Copy/CopyArea";
import { useLanguage } from "../../../../contexts/LanguageContext";

export function FamilyAndEmergency({ icon, userInfo }: OverviewProps) {
  const { t } = useLanguage();

  const emergencyInfo = [
    { label: t("Emergency name"), content: userInfo.emergencyContact?.name },
    { label: t("Relationship"), content: userInfo.emergencyContact?.relationship },
    { label: t("Phone"), icon: <PhoneOutlined />, content: userInfo.emergencyContact?.phone },
  ]

  return (
    <div className="profile-section">
      <TitleHeader icon={icon} title={t("Family & Emergency")} />

      <div className="bg-neutral-50 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between">
        {emergencyInfo.map((item, index) => (
          <div
            key={index}
            className="flex flex-1 flex-col justify-center gap-2 min-w-[280px] px-4 py-3"
          >
            <p className="text-neutral-500 body-3-medium uppercase">{item.label}</p>
            <CopyArea icon={item.icon} index={index} content={item.content ? item.content : 'N/A'} />
          </div>
        ))}
      </div>
    </div>
  )
}