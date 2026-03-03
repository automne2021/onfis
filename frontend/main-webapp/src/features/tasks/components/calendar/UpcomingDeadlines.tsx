import type { UpcomingDeadline } from "./types";
import { ArrowRightIcon } from "../../../../components/common/Icons";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  onViewAll?: () => void;
  onDeadlineClick?: (id: string) => void;
}

export default function UpcomingDeadlines({ deadlines, onViewAll, onDeadlineClick }: UpcomingDeadlinesProps) {
  const getMonthAbbr = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-100 card-hover">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">Upcoming Deadlines</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
        >
          View All
        </button>
      </div>

      {/* Deadline Items */}
      <div className="space-y-2">
        {deadlines.map((deadline) => (
          <button
            key={deadline.id}
            onClick={() => onDeadlineClick?.(deadline.id)}
            className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-neutral-50 transition-colors group"
          >
            {/* Date Badge */}
            <div className="flex-shrink-0 w-10 h-10 bg-primary/5 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[9px] font-medium text-primary/70 leading-tight">
                {getMonthAbbr(deadline.date)}
              </span>
              <span className="text-sm font-bold text-primary leading-tight">
                {deadline.date.getDate()}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {deadline.title}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {deadline.subtitle} • {deadline.time}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-neutral-300 group-hover:text-neutral-400 transition-colors">
              <ArrowRightIcon />
            </div>
          </button>
        ))}

        {deadlines.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-4">
            No upcoming deadlines
          </p>
        )}
      </div>
    </div>
  );
}
