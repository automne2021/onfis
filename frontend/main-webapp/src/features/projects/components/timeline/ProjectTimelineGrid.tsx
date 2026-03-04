import { useRef } from "react";
import type { ProjectTimelineItem, TimelineConfig } from "./types";
import TimelineRow from "./TimelineRow";
import TimelineBar from "./TimelineBar";
import { isToday, isWeekend } from "./timelineUtils";

interface ProjectTimelineGridProps {
  projects: ProjectTimelineItem[];
  config: TimelineConfig;
  onProjectClick?: (project: ProjectTimelineItem) => void;
}

export default function ProjectTimelineGrid({
  projects,
  config,
  onProjectClick,
}: ProjectTimelineGridProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate total width
  const totalWidth = config.weeks.length * 7 * config.dayWidth;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Project List */}
      <div className="w-[320px] min-w-[320px] border-r border-neutral-200 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-500">
          <div className="w-40 min-w-[10rem]">PROJECT</div>
          <div className="w-24 min-w-[6rem]">OWNER</div>
          <div className="w-20 min-w-[5rem]">STATUS</div>
        </div>

        {/* Project Rows */}
        <div className="flex-1 overflow-y-auto">
          {projects.map((project) => (
            <TimelineRow
              key={project.id}
              project={project}
              onClick={() => onProjectClick?.(project)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Timeline Grid */}
      <div className="flex-1 overflow-x-auto" ref={timelineRef}>
        <div style={{ minWidth: `${totalWidth}px` }}>
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200">
            {/* Week Headers */}
            <div className="flex">
              {config.weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex border-r border-neutral-200"
                  style={{ width: `${7 * config.dayWidth}px` }}
                >
                  <div className="w-full px-2 py-1 text-center">
                    <span className="text-xs font-medium text-neutral-500">
                      Week {week.weekNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="flex">
              {config.weeks.flatMap((week) =>
                week.days.map((day, dayIndex) => (
                  <div
                    key={`${week.weekNumber}-${dayIndex}`}
                    className={`flex flex-col items-center justify-center py-1 border-r border-neutral-100 ${isWeekend(day) ? "bg-neutral-100" : ""
                      } ${isToday(day) ? "bg-primary/10" : ""}`}
                    style={{ width: `${config.dayWidth}px` }}
                  >
                    <span className={`text-xs ${isToday(day) ? "text-primary font-bold" : "text-neutral-500"}`}>
                      {day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
                    </span>
                    <span className={`text-sm ${isToday(day) ? "text-primary font-bold" : "text-neutral-700"}`}>
                      {day.getDate()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="relative">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative border-b border-neutral-100"
                style={{ height: "44px" }}
              >
                {/* Grid Lines */}
                <div className="absolute inset-0 flex">
                  {config.weeks.flatMap((week) =>
                    week.days.map((day, dayIndex) => (
                      <div
                        key={`grid-${week.weekNumber}-${dayIndex}`}
                        className={`border-r border-neutral-100 ${isWeekend(day) ? "bg-neutral-50" : ""
                          } ${isToday(day) ? "bg-primary/5" : ""}`}
                        style={{ width: `${config.dayWidth}px` }}
                      />
                    ))
                  )}
                </div>

                {/* Project Bar */}
                <TimelineBar
                  project={project}
                  config={config}
                  onClick={() => onProjectClick?.(project)}
                />
              </div>
            ))}

            {/* Today Line */}
            {config.weeks.some((week) => week.days.some((day) => isToday(day))) && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                style={{
                  left: `${config.weeks.reduce((acc, week, weekIndex) => {
                    const todayIndex = week.days.findIndex((day) => isToday(day));
                    if (todayIndex !== -1) {
                      return weekIndex * 7 * config.dayWidth + todayIndex * config.dayWidth + config.dayWidth / 2;
                    }
                    return acc;
                  }, 0)
                    }px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
