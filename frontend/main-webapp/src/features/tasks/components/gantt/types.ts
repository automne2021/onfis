// Gantt Chart specific types
import type { Assignee, TaskPriority } from "../../types";

export type GanttTaskStatus = "done" | "in_progress" | "review" | "to_do";

export type GanttViewMode = "day" | "week" | "month";

export interface GanttTask {
  id: string;
  taskKey?: string;
  name: string;
  owner: Assignee;
  status: GanttTaskStatus;
  startDate: Date;
  endDate: Date;
  priority?: TaskPriority;
  projectName?: string;
  description?: string;
  subTasks?: GanttSubTask[];
}

export interface GanttSubTask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: Assignee;
}

export interface GanttWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: Date[];
}

export interface GanttTimelineConfig {
  viewMode: GanttViewMode;
  startDate: Date;
  endDate: Date;
  weeks: GanttWeek[];
  totalDays: number;
  dayWidth: number;
}

// Status colors matching tailwind config
export const statusColors: Record<GanttTaskStatus, { bg: string; text: string; bar: string }> = {
  done: {
    bg: "bg-status-done/15",
    text: "text-status-done",
    bar: "bg-status-done",
  },
  in_progress: {
    bg: "bg-primary/15",
    text: "text-primary",
    bar: "bg-primary",
  },
  review: {
    bg: "bg-status-on_track/15",
    text: "text-status-on_track",
    bar: "bg-status-on_track",
  },
  to_do: {
    bg: "bg-neutral-200",
    text: "text-neutral-500",
    bar: "bg-neutral-400",
  },
};

export const statusLabels: Record<GanttTaskStatus, string> = {
  done: "Done",
  in_progress: "In Progress",
  review: "Review",
  to_do: "To Do",
};
