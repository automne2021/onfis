import type { OverviewProps } from "../../types/userProfileTypes";
import { SkillTags } from "../Tags/SkillTag";
import { useLanguage } from "../../../../contexts/LanguageContext";

export function CoreSkills({ icon, userInfo }: OverviewProps) {
  const { t } = useLanguage();
  return (
    <div className="profile-section">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="header-h6 leading-none text-neutral-900">{t("Core Skills")}</p>
      </div>

      <div className="flex items-center gap-3">
        {userInfo.skills && userInfo.skills.length > 0 ? (
          userInfo.skills.map((item, index) => (
            <SkillTags key={index} label={item} />
          ))
        ) : (
          <p className="body-2-regular text-neutral-500"> {t("No skills available.")}</p>
        )}
      </div>
    </div>
  )
}