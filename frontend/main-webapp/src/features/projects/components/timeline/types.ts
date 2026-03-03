import type { Project, ProjectStatus, Priority } from "../../types";

export type TimelineViewMode = "day" | "week" | "month";

export interface ProjectTimelineItem extends Project {
  startDate: Date;
  endDate: Date;
}

export interface TimelineWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: Date[];
}

export interface TimelineConfig {
  viewMode: TimelineViewMode;
  startDate: Date;
  endDate: Date;
  weeks: TimelineWeek[];
  totalDays: number;
  dayWidth: number;
}

// Status colors for timeline bars
export const timelineStatusColors: Record<ProjectStatus, { bar: string; bg: string }> = {
  planning: {
    bar: "bg-status-on_hold",
    bg: "bg-status-on_hold/20",
  },
  in_progress: {
    bar: "bg-primary",
    bg: "bg-primary/20",
  },
  on_hold: {
    bar: "bg-status-off_track",
    bg: "bg-status-off_track/20",
  },
  completed: {
    bar: "bg-status-done",
    bg: "bg-status-done/20",
  },
};

export const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
};

export const priorityColors: Record<Priority, string> = {
  urgent: "#E7000B",
  high: "#FF6900",
  medium: "#FFD230",
  low: "#99A1AF",
};

// Helper to convert Project to ProjectTimelineItem with dates
export function projectToTimelineItem(project: Project): ProjectTimelineItem {
  // Parse the dueDate and create a start date 30 days before
  const dueDate = new Date(project.dueDate);
  const startDate = new Date(dueDate);
  startDate.setDate(startDate.getDate() - 30); // Default 30-day duration
  
  return {
    ...project,
    startDate,
    endDate: dueDate,
  };
}
