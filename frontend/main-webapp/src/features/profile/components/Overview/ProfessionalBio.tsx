import type { OverviewProps } from "../../types/userProfileTypes";

export function ProfessionalBio({ icon, userInfo }: OverviewProps) {
  return (
    <div className="profile-section">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="header-h6 leading-none text-neutral-900">Professional Bio</p>
      </div>

      <p className="body-2-regular text-neutral-600">
        {userInfo.bio}
      </p>

    </div>
  )
}