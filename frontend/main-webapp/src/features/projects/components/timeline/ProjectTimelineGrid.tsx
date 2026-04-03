import { useRef, useEffect } from "react";
import type { ProjectTimelineItem, TimelineConfig } from "./types";
import TimelineRow from "./TimelineRow";
import TimelineBar from "./TimelineBar";
import { isToday, isWeekend } from "./timelineUtils";

interface ProjectTimelineGridProps {
  projects: ProjectTimelineItem[];
  config: TimelineConfig;
  selectedProjectId?: string;
  onProjectClick?: (project: ProjectTimelineItem) => void;
}

export default function ProjectTimelineGrid({
  projects,
  config,
  selectedProjectId,
  onProjectClick,
}: ProjectTimelineGridProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Scroll to today on mount
  useEffect(() => {
    if (!timelineRef.current) return;
    const todayOffset = config.weeks.reduce<number | null>((acc, week, weekIndex) => {
      if (acc !== null) return acc;
      const dayIndex = week.days.findIndex((d) => isToday(d));
      if (dayIndex !== -1) {
        return (weekIndex * 7 + dayIndex) * config.dayWidth + config.dayWidth / 2;
      }
      return null;
    }, null);
    if (todayOffset !== null) {
      const container = timelineRef.current;
      container.scrollLeft = Math.max(0, todayOffset - container.clientWidth / 2);
    }
  }, [config]);

  // Calculate total width
  const totalWidth = config.totalDays * config.dayWidth;

  return (
    <div className="flex flex-1 overflow-hidden border border-neutral-200 rounded-lg bg-white">
      {/* Left Panel - Project List */}
      <div className="w-[300px] flex-shrink-0 border-r border-neutral-200">
        {/* Header */}
        <div className="flex items-center h-[56px] border-b border-neutral-200 bg-neutral-50">
          <div className="flex-1 min-w-[140px] px-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Project</span>
          </div>
          <div className="w-24 px-2 text-center">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Owner</span>
          </div>
          <div className="w-20 px-2 text-center">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</span>
          </div>
        </div>

        {/* Project Rows */}
        <div className="overflow-y-auto" style={{ height: "calc(100% - 56px)" }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className={project.id === selectedProjectId ? "bg-primary/5" : ""}
            >
              <TimelineRow
                project={project}
                onClick={() => onProjectClick?.(project)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Timeline Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden" ref={timelineRef}>
        <div style={{ minWidth: `${totalWidth}px` }}>
          {/* Timeline Header */}
          <div className="h-[56px] border-b border-neutral-200 bg-neutral-50">
            {/* Week Row */}
            <div className="flex h-7 border-b border-neutral-200">
              {config.weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex items-center justify-center border-r border-neutral-200 text-xs font-semibold text-neutral-500"
                  style={{ width: `${7 * config.dayWidth}px` }}
                >
                  Week {week.weekNumber}
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="flex h-[28px]">
              {config.weeks.flatMap((week) =>
                week.days.map((day, dayIndex) => {
                  const isTodayDate = isToday(day);
                  const isWeekendDate = isWeekend(day);
                  return (
                    <div
                      key={`${week.weekNumber}-${dayIndex}`}
                      className={`flex items-center justify-center border-r border-neutral-200 text-xs ${
                        isTodayDate
                          ? "bg-priority-high/10 text-priority-high font-semibold"
                          : isWeekendDate
                          ? "bg-neutral-100 text-neutral-400"
                          : "text-neutral-500"
                      }`}
                      style={{ width: `${config.dayWidth}px` }}
                    >
                      {day.getDate().toString().padStart(2, "0")}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="relative" style={{ height: `${projects.length * 40}px` }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
              {config.weeks.flatMap((week) =>
                week.days.map((day, dayIndex) => (
                  <div
                    key={`grid-${week.weekNumber}-${dayIndex}`}
                    className={`h-full border-r border-neutral-100 ${isWeekend(day) ? "bg-neutral-50/50" : ""}`}
                    style={{ width: `${config.dayWidth}px` }}
                  />
                ))
              )}
            </div>

            {/* Project Bars */}
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`absolute left-0 right-0 h-10 border-b border-neutral-100 ${
                  project.id === selectedProjectId ? "bg-primary/5" : ""
                }`}
                style={{ top: `${index * 40}px` }}
              >
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
                className="absolute top-0 bottom-0 w-0.5 bg-priority-high z-20"
                style={{
                  left: `${config.weeks.reduce((acc, week, weekIndex) => {
                    const todayIndex = week.days.findIndex((day) => isToday(day));
                    if (todayIndex !== -1) {
                      return weekIndex * 7 * config.dayWidth + todayIndex * config.dayWidth + config.dayWidth / 2;
                    }
                    return acc;
                  }, 0)}px`,
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-priority-high text-white text-[10px] font-medium rounded">
                  Today
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
