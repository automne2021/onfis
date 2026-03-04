import type { CalendarEvent, CalendarDay } from "./types";

/**
 * Get all days for a calendar month view (including padding days from adjacent months)
 */
export function getCalendarDays(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];
  
  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = firstDay.getDay();
  
  // Add days from previous month to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push(createCalendarDay(date, false, today, events));
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push(createCalendarDay(date, true, today, events));
  }
  
  // Add days from next month to complete the grid (6 rows x 7 days = 42)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push(createCalendarDay(date, false, today, events));
  }
  
  return days;
}

function createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date, events: CalendarEvent[]): CalendarDay {
  const dayOfWeek = date.getDay();
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  
  // Filter events for this day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.toDateString() === dateStr;
  });
  
  return {
    date,
    isCurrentMonth,
    isToday: dateStr === todayStr,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    events: dayEvents,
  };
}

/**
 * Format month name for display
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Get short day names for calendar header
 */
export function getDayNames(): string[] {
  return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
}

/**
 * Get full day names for calendar header
 */
export function getFullDayNames(): string[] {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}
