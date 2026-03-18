import type { OverviewProps } from "../../types/userProfileTypes";

export function RecentActivity({ icon }: OverviewProps) {
  return (
    <div className="profile-section">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <p className="header-h6 leading-none text-neutral-900">Recent Activities</p>
      </div>

    </div>
  )
}