import type { ProjectTimelineItem, TimelineConfig } from "./types";
import { timelineStatusColors, priorityColors } from "./types";
import { calculateBarPosition, formatDate } from "./timelineUtils";
import { FlagIconColored as FlagIcon } from "../../../../components/common/Icons";

interface TimelineBarProps {
  project: ProjectTimelineItem;
  config: TimelineConfig;
  onClick?: () => void;
}

export default function TimelineBar({ project, config, onClick }: TimelineBarProps) {
  const { left, width } = calculateBarPosition(project, config);
  const colors = timelineStatusColors[project.status];

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md cursor-pointer transition-all hover:shadow-md ${colors.bar}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        minWidth: "60px",
      }}
      onClick={onClick}
      title={`${project.title}: ${formatDate(project.startDate)} - ${formatDate(project.endDate)}`}
    >
      {/* Progress overlay */}
      {project.progress < 100 && (
        <div
          className="absolute inset-0 rounded-lg bg-white/40"
          style={{
            left: `${project.progress}%`,
            width: `${100 - project.progress}%`,
          }}
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-1.5 px-2 h-full overflow-hidden">
        <FlagIcon color={priorityColors[project.priority]} />
        <span className="text-white text-xs font-medium truncate">
          {project.title}
        </span>
        <span className="text-white/80 text-xs ml-auto shrink-0">
          {project.progress}%
        </span>
      </div>
    </div>
  );
}
