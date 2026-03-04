import type { UpcomingDeadline } from "./types";
import { statusLabels } from "./types";
import { getTimeUntilDeadline, formatDate } from "./calendarUtils";
import { ClockIcon, FlagIconColored as FlagIcon } from "../../../../components/common/Icons";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  onDeadlineClick?: (deadline: UpcomingDeadline) => void;
}

const priorityColors = {
  urgent: "#E7000B",
  high: "#FF6900",
  medium: "#FFD230",
  low: "#99A1AF",
};

export default function UpcomingDeadlines({ deadlines, onDeadlineClick }: UpcomingDeadlinesProps) {
  return (
    <div className="bg-white rounded-[12px] p-3 shadow-sm border border-neutral-100">
      <h3 className="font-bold text-sm text-neutral-900 mb-3">Upcoming Deadlines</h3>

      <div className="space-y-2">
        {deadlines.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-4">No upcoming deadlines</p>
        ) : (
          deadlines.map((deadline) => (
            <button
              key={deadline.id}
              onClick={() => onDeadlineClick?.(deadline)}
              className="w-full p-2 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
            >
              <div className="flex items-start gap-2">
                <FlagIcon color={priorityColors[deadline.priority]} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-neutral-900 truncate">
                    {deadline.title}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate">{deadline.subtitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ClockIcon />
                    <span className="text-xs text-neutral-400">
                      {formatDate(deadline.date)} • {getTimeUntilDeadline(deadline.date)}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-1 rounded-full ${deadline.status === "completed"
                    ? "bg-status-done/15 text-status-done"
                    : deadline.status === "in_progress"
                      ? "bg-primary/15 text-primary"
                      : deadline.status === "on_hold"
                        ? "bg-status-off_track/15 text-status-off_track"
                        : "bg-status-on_hold/15 text-status-on_hold"
                    }`}
                >
                  {statusLabels[deadline.status]}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
