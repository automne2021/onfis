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
}

export default function ProjectTimelineView({ projects, onProjectClick }: ProjectTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<TimelineViewMode>("week");

  // Convert projects to timeline items
  const timelineProjects: ProjectTimelineItem[] = useMemo(
    () => projects.map(projectToTimelineItem),
    [projects]
  );

  // Generate timeline configuration
  const timelineConfig = useMemo(
    () => generateTimelineConfig(currentDate, viewMode, timelineProjects),
    [currentDate, viewMode, timelineProjects]
  );

  const handleProjectClick = (timelineProject: ProjectTimelineItem) => {
    const originalProject = projects.find((p) => p.id === timelineProject.id);
    if (originalProject && onProjectClick) {
      onProjectClick(originalProject);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      {/* Toolbar */}
      <TimelineToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Timeline Grid */}
      <div className="flex-1 mt-2 overflow-hidden bg-white border border-neutral-200 rounded-lg">
        {timelineProjects.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No projects to display
          </div>
        ) : (
          <ProjectTimelineGrid
            projects={timelineProjects}
            config={timelineConfig}
            onProjectClick={handleProjectClick}
          />
        )}
        </div>
    </div>
  );
}
