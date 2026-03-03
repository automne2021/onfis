import type { Project, ProjectStatus } from "../../types";

export interface ProjectListColumn {
  key: keyof Project | "actions";
  label: string;
  width?: string;
  sortable?: boolean;
}

export interface SortConfig {
  key: keyof Project | null;
  direction: "asc" | "desc";
}

export const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
};

export const statusColors: Record<ProjectStatus, { bg: string; text: string }> = {
  planning: {
    bg: "bg-status-on_hold/15",
    text: "text-status-on_hold",
  },
  in_progress: {
    bg: "bg-primary/15",
    text: "text-primary",
  },
  on_hold: {
    bg: "bg-status-off_track/15",
    text: "text-status-off_track",
  },
  completed: {
    bg: "bg-status-done/15",
    text: "text-status-done",
  },
};
