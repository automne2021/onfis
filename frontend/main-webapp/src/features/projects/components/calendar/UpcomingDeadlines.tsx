import type { UpcomingDeadline } from "./types";
import { eventColors, statusLabels } from "./types";
import { FlagIconColored } from "../../../../components/common/Icons";

const priorityColor: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

function timeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Overdue";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d left`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1w left" : `${weeks}w left`;
}

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  onDeadlineClick?: (id: string) => void;
}

export default function UpcomingDeadlines({ deadlines, onDeadlineClick }: UpcomingDeadlinesProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-100 card-hover">
      {/* Header */}
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">Upcoming Deadlines</h3>

      {/* Deadline Items */}
      <div className="space-y-2">
        {deadlines.map((deadline) => {
          const colors = eventColors[deadline.status];
          return (
            <button
              key={deadline.id}
              onClick={() => onDeadlineClick?.(deadline.id)}
              className="w-full flex items-center gap-2.5 p-2 -mx-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {/* Flag icon with priority color */}
              <div className="flex-shrink-0">
                <FlagIconColored color={priorityColor[deadline.priority] ?? "#94a3b8"} size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate leading-tight">
                  {deadline.title}
                </p>
                <p className="text-xs text-neutral-400 truncate">{timeUntil(deadline.date)}</p>
              </div>

              {/* Status badge */}
              <span
                className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
              >
                {statusLabels[deadline.status]}
              </span>
            </button>
          );
        })}

        {deadlines.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-4">
            No upcoming deadlines
          </p>
        )}
      </div>
    </div>
  );
}
