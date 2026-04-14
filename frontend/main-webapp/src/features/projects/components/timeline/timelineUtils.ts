import type { TimelineConfig, TimelineViewMode, TimelineWeek, ProjectTimelineItem } from "./types";

/**
 * Get the week number for a given date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the Monday of the week containing the given date
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate timeline configuration based on current date and view mode
 */
export function generateTimelineConfig(
  currentDate: Date,
  viewMode: TimelineViewMode,
  projects: ProjectTimelineItem[]
): TimelineConfig {
  // Find the date range from projects or use defaults
  let startDate = new Date(currentDate);
  let endDate = new Date(currentDate);

  if (projects.length > 0) {
    const starts = projects.map((p) => p.startDate.getTime());
    const ends = projects.map((p) => p.endDate.getTime());
    startDate = new Date(Math.min(...starts));
    endDate = new Date(Math.max(...ends));
  }

  // Extend range for padding
  const paddedStart = new Date(startDate);
  paddedStart.setDate(paddedStart.getDate() - 7);
  const paddedEnd = new Date(endDate);
  paddedEnd.setDate(paddedEnd.getDate() + 14);

  // Get Monday of start week
  const weekStart = getMonday(paddedStart);

  // Calculate weeks
  const weeks: TimelineWeek[] = [];
  const currentWeekStart = new Date(weekStart);

  while (currentWeekStart <= paddedEnd) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    weeks.push({
      weekNumber: getWeekNumber(currentWeekStart),
      startDate: new Date(currentWeekStart),
      endDate: weekEnd,
      days,
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  const totalDays = weeks.length * 7;
  const dayWidth = viewMode === "day" ? 60 : viewMode === "week" ? 30 : 12;

  return {
    viewMode,
    startDate: weekStart,
    endDate: paddedEnd,
    weeks,
    totalDays,
    dayWidth,
  };
}

/**
 * Calculate the position and width of a project bar in the timeline
 */
export function calculateBarPosition(
  project: ProjectTimelineItem,
  config: TimelineConfig
): { left: number; width: number } {
  const configStart = config.startDate.getTime();
  const projectStart = project.startDate.getTime();
  const projectEnd = project.endDate.getTime();

  const startOffset = Math.max(0, (projectStart - configStart) / (1000 * 60 * 60 * 24));
  const duration = (projectEnd - projectStart) / (1000 * 60 * 60 * 24);

  return {
    left: startOffset * config.dayWidth,
    width: Math.max(duration * config.dayWidth, config.dayWidth), // Minimum 1 day width
  };
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: "short" | "long" = "short"): string {
  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Get month name
 */
export function getMonthName(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
