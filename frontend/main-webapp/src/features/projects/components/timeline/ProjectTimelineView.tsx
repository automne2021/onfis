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

  const handleFilter = () => {
    // TODO: Implement filter modal
    console.log("Open filter modal");
  };

  const handleGroupBy = () => {
    // TODO: Implement group by functionality
    console.log("Group by selected");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[12px] shadow-sm border border-neutral-100 overflow-hidden">
      {/* Toolbar */}
      <TimelineToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFilter={handleFilter}
        onGroupBy={handleGroupBy}
      />

      {/* Timeline Grid */}
      {timelineProjects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400">
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
  );
}
