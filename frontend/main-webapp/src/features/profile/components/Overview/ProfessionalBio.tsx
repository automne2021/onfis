import type { OverviewProps } from "../../types/userProfileTypes";
import { useLanguage } from "../../../../contexts/LanguageContext";

export function ProfessionalBio({ icon, userInfo }: OverviewProps) {
  const { t } = useLanguage();
  return (
    <div className="profile-section">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="header-h6 leading-none text-neutral-900">{t("Professional Bio")}</p>
      </div>

      <p className="body-2-regular text-neutral-600">
        {userInfo.bio}
      </p>

    </div>
  )
}