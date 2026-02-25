import type { OverviewProps } from "../../types/userProfileTypes";
import { SkillTags } from "../Tags/SkillTag";

export function CoreSkills({ icon, userInfo } : OverviewProps) {
  return(
    <div className="bg-white rounded-lg py-10 px-6 flex flex-col gap-6 relative">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="header-h6 leading-none text-neutral-900">Core Skills</p>
      </div>

      <div className="flex items-center gap-3">
        {userInfo.skills && userInfo.skills.length > 0 ? (
          userInfo.skills.map((item, index) => (
            <SkillTags key={index} label={item} />
          ))
        ) : (
          <p className="body-2-regular text-neutral-500"> No skills available.</p>
        )}
      </div>
    </div>
  )
}