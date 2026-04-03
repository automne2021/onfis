import { useState, useMemo } from "react";
import type { Project } from "../../types";
import type { ProjectTimelineItem, TimelineViewMode } from "./types";
import { projectToTimelineItem } from "./types";
import TimelineToolbar from "./TimelineToolbar";
import ProjectTimelineGrid from "./ProjectTimelineGrid";
import ProjectTimelineDetailPanel from "./ProjectTimelineDetailPanel";
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
  const [selectedProject, setSelectedProject] = useState<ProjectTimelineItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
    setSelectedProject(timelineProject);
    setIsPanelOpen(true);
    const originalProject = projects.find((p) => p.id === timelineProject.id);
    if (originalProject && onProjectClick) {
      onProjectClick(originalProject);
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
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
          <>
            <ProjectTimelineGrid
              projects={timelineProjects}
              config={timelineConfig}
              selectedProjectId={selectedProject?.id}
              onProjectClick={handleProjectClick}
            />

            <ProjectTimelineDetailPanel
              project={selectedProject}
              isOpen={isPanelOpen}
              onClose={handleClosePanel}
            />
          </>
        )}
      </div>
    </div>
  );
}
