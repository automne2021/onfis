import type { Project, ProjectStatus, Priority } from "../../types";

export interface ProjectCalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  project: Project;
  color: "planning" | "in_progress" | "on_hold" | "completed";
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: ProjectCalendarEvent[];
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  status: ProjectStatus;
  priority: Priority;
}

export interface StatusCount {
  completed: number;
  inProgress: number;
  toDo: number;
}

export const eventColors: Record<ProjectStatus, { bg: string; border: string; text: string }> = {
  planning: {
    bg: "bg-status-on_hold/20",
    border: "border-status-on_hold",
    text: "text-status-on_hold",
  },
  in_progress: {
    bg: "bg-primary/20",
    border: "border-primary",
    text: "text-primary",
  },
  on_hold: {
    bg: "bg-status-off_track/20",
    border: "border-status-off_track",
    text: "text-status-off_track",
  },
  completed: {
    bg: "bg-status-done/20",
    border: "border-status-done",
    text: "text-status-done",
  },
};

export const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
};
