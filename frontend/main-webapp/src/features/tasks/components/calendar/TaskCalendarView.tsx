import { useState, useMemo } from "react";
import type { ViewMode } from "../../types";
import type { Task } from "../../types";
import type { CalendarEvent, UpcomingDeadline, StatusCount } from "./types";
import { getCalendarDays } from "./calendarUtils";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import MiniCalendar from "./MiniCalendar";
import UpcomingDeadlines from "./UpcomingDeadlines";
import StatusOverview from "./StatusOverview";

interface TaskCalendarViewProps {
  tasks: Task[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const toDate = (raw?: string | null): Date | null => {
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const STATUS_TO_COLOR: Record<Task["status"], CalendarEvent["color"]> = {
  TODO: "neutral",
  IN_PROGRESS: "primary",
  BLOCKED: "error",
  IN_REVIEW: "info",
  DONE: "success",
};

export default function TaskCalendarView({ tasks, viewMode: _viewMode, onViewModeChange: _onViewModeChange }: TaskCalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

  const events = useMemo<CalendarEvent[]>(() => {
    return tasks.reduce<CalendarEvent[]>((acc, task) => {
        const dueDate = toDate(task.dueDateRaw);
        if (!dueDate) {
          return acc;
        }
        acc.push({
          id: task.id,
          title: task.title,
          date: dueDate,
          color: STATUS_TO_COLOR[task.status],
          dueTime: task.key,
        });
        return acc;
      }, []);
  }, [tasks]);

  const upcomingDeadlines = useMemo<UpcomingDeadline[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return tasks
      .map((task) => {
        const dueDate = toDate(task.dueDateRaw);
        if (!dueDate || dueDate < now) {
          return null;
        }
        return {
          id: task.id,
          title: task.title,
          subtitle: task.projectTitle || "Project Task",
          date: dueDate,
          time: task.key || "",
        } satisfies UpcomingDeadline;
      })
      .filter((deadline): deadline is UpcomingDeadline => deadline !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [tasks]);

  const statusCounts = useMemo<StatusCount>(() => {
    return tasks.reduce(
      (acc, task) => {
        if (task.status === "DONE") {
          acc.completed += 1;
        } else if (task.status === "TODO") {
          acc.toDo += 1;
        } else {
          acc.inProgress += 1;
        }
        return acc;
      },
      { completed: 0, inProgress: 0, toDo: 0 } satisfies StatusCount,
    );
  }, [tasks]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth, events),
    [currentYear, currentMonth, events]
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (_eventId: string) => {};

  const handleDeadlineClick = (_deadlineId: string) => {};

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      {/* Header with tabs and month navigation */}
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Main Content: Calendar + Sidebar */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Calendar Grid - Takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0">
          <CalendarGrid
            days={calendarDays}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        </div>

        {/* Right Sidebar - Fixed width, scrollable on small heights */}
        <aside className="hidden lg:flex flex-col gap-3 w-[240px] xl:w-[260px] flex-shrink-0 overflow-y-auto">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
          <UpcomingDeadlines
            deadlines={upcomingDeadlines}
            onViewAll={() => {}}
            onDeadlineClick={handleDeadlineClick}
          />
          <StatusOverview status={statusCounts} />
        </aside>
      </div>
    </div>
  );
}
