import type { Project } from "../../types";
import type { CalendarDay, ProjectCalendarEvent } from "./types";

/**
 * Get all days for a calendar month view (includes days from prev/next months)
 */
export function getCalendarDays(
  year: number,
  month: number,
  projects: Project[]
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  // Get the starting day (Sunday of the week containing the first of the month)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Get the ending day (Saturday of the week containing the last of the month)
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // Convert projects to calendar events
  const events: ProjectCalendarEvent[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    date: new Date(project.dueDate),
    project,
    color: project.status,
  }));

  const days: CalendarDay[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateEvents = events.filter(
      (event) =>
        event.date.getFullYear() === currentDate.getFullYear() &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getDate() === currentDate.getDate()
    );

    days.push({
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday:
        currentDate.getFullYear() === today.getFullYear() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getDate() === today.getDate(),
      isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      events: dateEvents,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: "short" | "long" | "full" = "short"): string {
  const options: Intl.DateTimeFormatOptions = 
    format === "short"
      ? { month: "short", day: "numeric" }
      : format === "long"
      ? { month: "long", day: "numeric", year: "numeric" }
      : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Get month name and year
 */
export function getMonthYear(year: number, month: number): string {
  const date = new Date(year, month);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Get abbreviated day names
 */
export function getDayNames(): string[] {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}

/**
 * Calculate time until deadline
 */
export function getTimeUntilDeadline(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  return `${Math.floor(days / 30)} months`;
}
