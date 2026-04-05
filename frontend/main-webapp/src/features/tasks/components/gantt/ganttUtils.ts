import type { GanttTask, GanttViewMode, GanttTimelineConfig, GanttWeek } from "./types";

/**
 * Generate timeline configuration based on view mode and date range
 */
export function generateTimelineConfig(
  currentDate: Date,
  viewMode: GanttViewMode,
  tasks: GanttTask[]
): GanttTimelineConfig {
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Extend range based on tasks
  let minDate = startDate;
  let maxDate = endDate;
  
  tasks.forEach(task => {
    if (task.startDate < minDate) minDate = new Date(task.startDate);
    if (task.endDate > maxDate) maxDate = new Date(task.endDate);
  });

  // Add buffer days
  minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() - 3);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 7);

  const weeks = generateWeeks(minDate, maxDate);

  // The rendered cells start from the Monday of minDate's week — use that as the
  // reference point so that getTodayPosition() and calculateBarPosition() align
  // correctly with the cell grid.
  const firstRenderedDay = weeks[0]?.days[0] ?? minDate;
  const totalDays = Math.ceil((maxDate.getTime() - firstRenderedDay.getTime()) / (1000 * 60 * 60 * 24));
  
  // Day width based on view mode
  const dayWidth = viewMode === "day" ? 60 : viewMode === "week" ? 30 : 12;

  return {
    viewMode,
    startDate: firstRenderedDay,
    endDate: maxDate,
    weeks,
    totalDays,
    dayWidth,
  };
}

/**
 * Generate weeks array for timeline header
 */
function generateWeeks(startDate: Date, endDate: Date): GanttWeek[] {
  const weeks: GanttWeek[] = [];
  const current = new Date(startDate);
  
  // Move to start of week (Monday)
  const dayOfWeek = current.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setDate(current.getDate() + diff);

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    weeks.push({
      weekNumber: getWeekNumber(weekStart),
      startDate: weekStart,
      endDate: weekEnd,
      days,
    });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate position and width of a task bar in the timeline
 */
export function calculateBarPosition(
  task: GanttTask,
  config: GanttTimelineConfig
): { left: number; width: number } {
  const startOffset = Math.max(
    0,
    Math.floor((task.startDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const duration = Math.ceil(
    (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    left: startOffset * config.dayWidth,
    width: Math.max(duration * config.dayWidth - 4, config.dayWidth - 4), // Min width of 1 day
  };
}

/**
 * Get today's position in timeline
 */
export function getTodayPosition(config: GanttTimelineConfig): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (today < config.startDate || today > config.endDate) {
    return null;
  }

  const offset = Math.floor(
    (today.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return offset * config.dayWidth + config.dayWidth / 2;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: "short" | "medium" | "long" = "medium"): string {
  const options: Intl.DateTimeFormatOptions = 
    format === "short" 
      ? { day: "numeric" }
      : format === "medium"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  
  return date.toLocaleDateString("en-US", options);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
