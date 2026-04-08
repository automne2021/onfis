import { useRef, useEffect } from "react";
import type { GanttTask, GanttTimelineConfig } from "./types";
import GanttTaskRow from "./GanttTaskRow";
import GanttBar from "./GanttBar";
import { isToday, isWeekend, getTodayPosition } from "./ganttUtils";

interface GanttTimelineProps {
  tasks: GanttTask[];
  config: GanttTimelineConfig;
  selectedTaskId?: string;
  onTaskSelect: (task: GanttTask) => void;
}

export default function GanttTimeline({
  tasks,
  config,
  selectedTaskId,
  onTaskSelect,
}: GanttTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const todayPosition = getTodayPosition(config);

  // Scroll to today on mount
  useEffect(() => {
    if (timelineRef.current && todayPosition !== null) {
      const container = timelineRef.current;
      const scrollLeft = todayPosition - container.clientWidth / 2;
      container.scrollLeft = Math.max(0, scrollLeft);
    }
  }, [todayPosition]);

  const totalWidth = config.totalDays * config.dayWidth;

  return (
    <div className="flex flex-1 overflow-hidden border border-neutral-200 rounded-lg bg-white">
      {/* Left Panel: Task List */}
      <div className="w-[300px] flex-shrink-0 border-r border-neutral-200">
        {/* Header */}
        <div className="flex items-center h-[56px] border-b border-neutral-200 bg-neutral-50">
          <div className="flex-1 min-w-[140px] px-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Task Name
            </span>
          </div>
          <div className="w-[80px] px-2 text-center">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Owner
            </span>
          </div>
          <div className="w-[80px] px-2 text-center">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Status
            </span>
          </div>
        </div>

        {/* Task Rows */}
        <div className="overflow-y-auto" style={{ height: "calc(100% - 56px)" }}>
          {tasks.map((task) => (
            <GanttTaskRow
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onClick={() => onTaskSelect(task)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel: Timeline */}
      <div ref={timelineRef} className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: `${totalWidth}px` }}>
          {/* Timeline Header */}
          <div className="h-[56px] border-b border-neutral-200 bg-neutral-50">
            {config.dayWidth >= 20 ? (
              <>
                {/* Week Row */}
                <div className="flex h-7 border-b border-neutral-200">
                  {config.weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="flex items-center justify-center border-r border-neutral-200 text-xs font-semibold text-neutral-500"
                      style={{ width: `${week.days.length * config.dayWidth}px` }}
                    >
                      Week {week.weekNumber}
                    </div>
                  ))}
                </div>
                {/* Days Row */}
                <div className="flex h-[28px]">
                  {config.weeks.map((week) =>
                    week.days.map((day, dayIndex) => {
                      const isTodayDate = isToday(day);
                      const isWeekendDate = isWeekend(day);
                      return (
                        <div
                          key={`${day.getTime()}-${dayIndex}`}
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
              </>
            ) : (
              <>
                {/* Month Row (month view: group days by month) */}
                <div className="flex h-7 border-b border-neutral-200">
                  {(() => {
                    const allDays = config.weeks.flatMap((w) => w.days);
                    const groups: { label: string; count: number }[] = [];
                    allDays.forEach((day) => {
                      const label = day.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                      if (groups.length === 0 || groups[groups.length - 1].label !== label) {
                        groups.push({ label, count: 1 });
                      } else {
                        groups[groups.length - 1].count += 1;
                      }
                    });
                    return groups.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center border-r border-neutral-200 text-xs font-semibold text-neutral-500 overflow-hidden"
                        style={{ width: `${g.count * config.dayWidth}px` }}
                      >
                        {g.label}
                      </div>
                    ));
                  })()}
                </div>
                {/* Week Row (abbreviated W##) */}
                <div className="flex h-[28px]">
                  {config.weeks.map((week, weekIndex) => {
                    const hasToday = week.days.some((d) => isToday(d));
                    return (
                      <div
                        key={weekIndex}
                        className={`flex items-center justify-center border-r border-neutral-200 text-[10px] font-medium overflow-hidden ${
                          hasToday ? "bg-priority-high/10 text-priority-high" : "text-neutral-400"
                        }`}
                        style={{ width: `${week.days.length * config.dayWidth}px` }}
                      >
                        W{week.weekNumber}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Timeline Body with Bars */}
          <div className="relative" style={{ height: `${tasks.length * 40}px` }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
              {config.weeks.map((week) =>
                week.days.map((day, dayIndex) => {
                  const isWeekendDate = isWeekend(day);
                  return (
                    <div
                      key={`grid-${day.getTime()}-${dayIndex}`}
                      className={`h-full border-r border-neutral-100 ${isWeekendDate ? "bg-neutral-50/50" : ""
                        }`}
                      style={{ width: `${config.dayWidth}px` }}
                    />
                  );
                })
              )}
            </div>

            {/* Today Line */}
            {todayPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-priority-high z-20"
                style={{ left: `${todayPosition}px` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-priority-high text-white text-[10px] font-medium rounded">
                  Today
                </div>
              </div>
            )}

            {/* Task Bars */}
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="absolute left-0 right-0 h-10 border-b border-neutral-100"
                style={{ top: `${index * 40}px` }}
              >
                <GanttBar
                  task={task}
                  config={config}
                  onClick={() => onTaskSelect(task)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
