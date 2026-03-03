import { useState, useMemo } from "react";
import type { GanttTask, GanttViewMode } from "./types";
import GanttToolbar from "./GanttToolbar";
import GanttTimeline from "./GanttTimeline";
import GanttTaskDetailPanel from "./GanttTaskDetailPanel";
import { generateTimelineConfig } from "./ganttUtils";

interface GanttViewProps {
  tasks?: GanttTask[];
}

// Mock data matching the Figma design
const mockTasks: GanttTask[] = [
  {
    id: "task-1",
    name: "Kickoff Meeting",
    owner: { id: "1", name: "John Doe" },
    status: "done",
    startDate: new Date(2023, 9, 30), // Oct 30
    endDate: new Date(2023, 10, 1),   // Nov 1
    priority: "high",
    projectName: "Website Redesign",
    description: "Initial project kickoff meeting with all stakeholders.",
  },
  {
    id: "task-2",
    name: "UX Research",
    owner: { id: "2", name: "Jane Smith" },
    status: "in_progress",
    startDate: new Date(2023, 10, 2),  // Nov 2
    endDate: new Date(2023, 10, 8),    // Nov 8
    priority: "high",
    projectName: "Website Redesign",
    description: "Conduct user research and analyze current user flows.",
  },
  {
    id: "task-3",
    name: "Wireframing",
    owner: { id: "3", name: "Alice Morgan" },
    status: "review",
    startDate: new Date(2023, 10, 6),  // Nov 6
    endDate: new Date(2023, 10, 12),   // Nov 12
    priority: "medium",
    projectName: "Website Redesign",
    description: "Create wireframes for all main pages and user flows.",
  },
  {
    id: "task-4",
    name: "UI Design System",
    owner: { id: "4", name: "Alex Lee" },
    status: "to_do",
    startDate: new Date(2023, 10, 10), // Nov 10
    endDate: new Date(2023, 10, 18),   // Nov 18
    priority: "medium",
    projectName: "Website Redesign",
    description: "Develop comprehensive UI design system and component library.",
  },
  {
    id: "task-5",
    name: "Frontend Development",
    owner: { id: "2", name: "Jane Smith" },
    status: "in_progress",
    startDate: new Date(2023, 10, 5),  // Nov 5
    endDate: new Date(2023, 10, 15),   // Nov 15
    priority: "high",
    projectName: "Website Redesign",
    description: "Implement the main frontend architecture using Vue.js and Tailwind CSS.",
    subTasks: [
      { id: "st-1", title: "Environment Setup", completed: true, assignee: { id: "2", name: "Jane Smith" } },
      { id: "st-2", title: "Router Configuration", completed: true, assignee: { id: "2", name: "Jane Smith" } },
      { id: "st-3", title: "Component Architecture", completed: false, assignee: { id: "5", name: "Mike Brown" } },
      { id: "st-4", title: "State Management", completed: false },
      { id: "st-5", title: "API Integration", completed: false },
    ],
  },
  {
    id: "task-6",
    name: "Component Library",
    owner: { id: "5", name: "James Davis" },
    status: "to_do",
    startDate: new Date(2023, 10, 14), // Nov 14
    endDate: new Date(2023, 10, 22),   // Nov 22
    priority: "low",
    projectName: "Website Redesign",
    description: "Build reusable component library based on design system.",
  },
  {
    id: "task-7",
    name: "Page Layouts",
    owner: { id: "6", name: "Sarah Wilson" },
    status: "to_do",
    startDate: new Date(2023, 10, 18), // Nov 18
    endDate: new Date(2023, 10, 28),   // Nov 28
    priority: "medium",
    projectName: "Website Redesign",
    description: "Create all page layouts using the component library.",
  },
];

export default function GanttView({ tasks = mockTasks }: GanttViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2023, 10, 1)); // November 2023
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

  const handleFilter = () => {
    // TODO: Implement filter modal
    console.log("Open filter modal");
  };

  const handleGroupBy = () => {
    // TODO: Implement group by functionality
    console.log("Group by selected");
  };

  const handleSaveTask = (updatedTask: GanttTask) => {
    // TODO: Implement save functionality
    console.log("Save task:", updatedTask);
    setIsPanelOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      {/* Toolbar */}
      <GanttToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFilter={handleFilter}
        onGroupBy={handleGroupBy}
      />

      {/* Main Content */}
      <div className="flex flex-1 mt-2 overflow-hidden">
        {/* Timeline */}
        <GanttTimeline
          tasks={tasks}
          config={timelineConfig}
          selectedTaskId={selectedTask?.id}
          onTaskSelect={handleTaskSelect}
        />

        {/* Detail Panel */}
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
