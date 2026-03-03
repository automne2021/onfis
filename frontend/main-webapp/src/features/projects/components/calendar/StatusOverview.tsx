import type { StatusCount } from "./types";
import { CheckCircleIcon as CheckIcon, ProgressIcon, PauseIcon, PlanningIcon } from "../../../../components/common/Icons";

interface StatusOverviewProps {
  counts: StatusCount;
}

export default function StatusOverview({ counts }: StatusOverviewProps) {
  const stats = [
    { label: "Planning", count: counts.planning, icon: <PlanningIcon />, color: "text-status-on_hold" },
    { label: "In Progress", count: counts.inProgress, icon: <ProgressIcon />, color: "text-primary" },
    { label: "On Hold", count: counts.onHold, icon: <PauseIcon />, color: "text-status-off_track" },
    { label: "Completed", count: counts.completed, icon: <CheckIcon />, color: "text-status-done" },
  ];

  const total = counts.planning + counts.inProgress + counts.onHold + counts.completed;

  return (
    <div className="bg-white rounded-[12px] p-3 shadow-sm border border-neutral-100">
      <h3 className="font-bold text-sm text-neutral-900 mb-3">Status Overview</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
            {stat.icon}
            <div>
              <p className={`font-bold text-base ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Total Projects</span>
          <span className="font-medium text-neutral-900">{total}</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 overflow-hidden flex">
          {total > 0 && (
            <>
              <div
                className="h-full bg-status-done"
                style={{ width: `${(counts.completed / total) * 100}%` }}
              />
              <div
                className="h-full bg-primary"
                style={{ width: `${(counts.inProgress / total) * 100}%` }}
              />
              <div
                className="h-full bg-status-off_track"
                style={{ width: `${(counts.onHold / total) * 100}%` }}
              />
              <div
                className="h-full bg-status-on_hold"
                style={{ width: `${(counts.planning / total) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
