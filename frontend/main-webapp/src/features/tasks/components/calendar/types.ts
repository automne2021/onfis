export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  color: "primary" | "success" | "error" | "warning" | "info" | "purple" | "neutral";
  dueTime?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  time: string;
}

export interface StatusCount {
  completed: number;
  inProgress: number;
  toDo: number;
}
