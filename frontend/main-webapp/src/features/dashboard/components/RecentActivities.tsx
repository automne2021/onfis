interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

import { HistoryIcon } from "../../../components/common/Icons";

export default function RecentActivities({
  activities,
}: RecentActivitiesProps) {
  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-neutral-100 p-3 lg:p-4 flex flex-col relative min-h-[200px]">
      {/* Timeline line — centered on the dots (dot is w-3 = 12px, padding-left 12px, center = 12+6 = 18px) */}
      <div
        className="absolute w-0.5 bg-neutral-200"
        style={{
          left: '18px',
          top: '24px',
          bottom: '60px',
        }}
      />

      {/* Activity Items */}
      <div className="flex flex-col gap-4 relative z-10">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-2.5">
            {/* Timeline dot — centered at left edge via margin */}
            <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-0.5" />

            {/* Content */}
            <div className="flex flex-col gap-1">
              <p className="text-xs leading-4">
                <span className="font-medium text-black">{activity.user} </span>
                <span className="font-normal text-black">{activity.action} </span>
                <span className="font-medium text-primary">{activity.target}</span>
                <span className="font-medium text-black">.</span>
              </p>
              <span className="font-medium text-xs leading-4 text-neutral-400">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* View All History Button */}
      <div className="mt-auto pt-3">
        <button className="w-full flex items-center justify-center gap-2 bg-neutral-50 border border-neutral-200 rounded-[12px] px-4 py-1.5 hover:bg-neutral-100 transition-colors">
          <HistoryIcon />
          <span className="font-medium text-xs leading-4 text-neutral-500">
            View all history
          </span>
        </button>
      </div>
    </div>
  );
}
