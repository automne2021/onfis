import { useState, useMemo } from "react";
import type { Project } from "../../types";
import type { ProjectTimelineItem, TimelineViewMode } from "./types";
import { projectToTimelineItem } from "./types";
import TimelineToolbar from "./TimelineToolbar";
import ProjectTimelineGrid from "./ProjectTimelineGrid";
import { generateTimelineConfig } from "./timelineUtils";

interface ProjectTimelineViewProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  currentDate?: Date;
  onCurrentDateChange?: (date: Date) => void;
}

export default function ProjectTimelineView({
  projects,
  onProjectClick,
  currentDate,
  onCurrentDateChange,
}: ProjectTimelineViewProps) {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<TimelineViewMode>("week");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const effectiveCurrentDate = currentDate ?? internalCurrentDate;

  const handleDateChange = (nextDate: Date) => {
    if (currentDate) {
      onCurrentDateChange?.(nextDate);
      return;
    }
    setInternalCurrentDate(nextDate);
    onCurrentDateChange?.(nextDate);
  };

  // Convert projects to timeline items
  const timelineProjects: ProjectTimelineItem[] = useMemo(
    () => projects.map(projectToTimelineItem),
    [projects]
  );

  // Generate timeline configuration
  const timelineConfig = useMemo(
    () => generateTimelineConfig(effectiveCurrentDate, viewMode, timelineProjects),
    [effectiveCurrentDate, viewMode, timelineProjects]
  );

  const handleProjectClick = (timelineProject: ProjectTimelineItem) => {
    setSelectedProjectId(timelineProject.id);
    const originalProject = projects.find((p) => p.id === timelineProject.id);
    if (originalProject && onProjectClick) {
      onProjectClick(originalProject);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      {/* Toolbar */}
      <TimelineToolbar
        currentDate={effectiveCurrentDate}
        onDateChange={handleDateChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Timeline Grid + Detail Panel */}
      <div className="flex flex-1 mt-2 overflow-hidden">
        {timelineProjects.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500 bg-white border border-neutral-200 rounded-lg">
            No projects to display
          </div>
        ) : (
          <ProjectTimelineGrid
            projects={timelineProjects}
            config={timelineConfig}
            selectedProjectId={selectedProjectId}
            onProjectClick={handleProjectClick}
          />
        )}
      </div>
    </div>
  );
}
