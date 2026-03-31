import { useMemo, useState } from "react";
import type { GanttTask, GanttViewMode } from "./types";
import GanttToolbar from "./GanttToolbar";
import GanttTimeline from "./GanttTimeline";
import GanttTaskDetailPanel from "./GanttTaskDetailPanel";
import { generateTimelineConfig } from "./ganttUtils";

interface GanttViewProps {
  tasks: GanttTask[];
}

export default function GanttView({ tasks }: GanttViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const firstTaskDate = tasks[0]?.startDate;
    return firstTaskDate ?? new Date();
  });
  const [viewMode, setViewMode] = useState<GanttViewMode>("week");
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const timelineConfig = useMemo(
    () => generateTimelineConfig(currentDate, viewMode, tasks),
    [currentDate, viewMode, tasks]
  );

  const handleTaskSelect = (task: GanttTask) => {
    setSelectedTask(task);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleSaveTask = (_updatedTask: GanttTask) => {
    setIsPanelOpen(false);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white border border-neutral-200 rounded-lg text-sm text-neutral-500 mt-2">
        No tasks with valid dates to render timeline.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      <GanttToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-1 mt-2 overflow-hidden">
        <GanttTimeline
          tasks={tasks}
          config={timelineConfig}
          selectedTaskId={selectedTask?.id}
          onTaskSelect={handleTaskSelect}
        />

        <GanttTaskDetailPanel
          task={selectedTask}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          onSave={handleSaveTask}
        />
      </div>
    </div>
  );
}
