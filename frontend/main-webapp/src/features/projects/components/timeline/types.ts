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
  const parseRaw = (raw?: string | null): Date | null => {
    if (!raw) return null;
    // Parse YYYY-MM-DD as local date
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const endDate = parseRaw(project.dueDateRaw) ?? new Date();
  const startDate = parseRaw(project.startDateRaw) ?? (() => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - 30);
    return d;
  })();

  return {
    ...project,
    startDate,
    endDate,
  };
}
