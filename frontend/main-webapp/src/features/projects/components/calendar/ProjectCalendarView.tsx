import { useEffect, useMemo, useState } from "react";
import type { Project } from "../../types";
import type { ProjectCalendarEvent, UpcomingDeadline, StatusCount } from "./types";
import { getCalendarDays } from "./calendarUtils";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import MiniCalendar from "./MiniCalendar";
import UpcomingDeadlines from "./UpcomingDeadlines";
import StatusOverview from "./StatusOverview";

interface ProjectCalendarViewProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  currentDate?: Date;
  onCurrentDateChange?: (date: Date) => void;
}

export default function ProjectCalendarView({
  projects,
  onProjectClick,
  currentDate,
  onCurrentDateChange,
}: ProjectCalendarViewProps) {
  const today = new Date();
  const seedDate = currentDate ?? today;
  const [currentMonth, setCurrentMonth] = useState(seedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(seedDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(seedDate);

  useEffect(() => {
    if (!currentDate) {
      return;
    }
    setCurrentMonth(currentDate.getMonth());
    setCurrentYear(currentDate.getFullYear());
    setSelectedDate(currentDate);
  }, [currentDate]);

  // Calculate calendar days
  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth, projects),
    [currentYear, currentMonth, projects]
  );

  // Calculate upcoming deadlines (next 30 days)
  const upcomingDeadlines: UpcomingDeadline[] = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return projects
      .filter((project) => {
        if (!project.dueDateRaw) return false;
        const raw = project.dueDateRaw;
        let dueDate: Date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const [y, m, d] = raw.split("-").map(Number);
          dueDate = new Date(y, m - 1, d);
        } else {
          dueDate = new Date(raw);
        }
        return !isNaN(dueDate.getTime()) && dueDate >= now && dueDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => {
        const parseRaw = (r: string) => (/^\d{4}-\d{2}-\d{2}$/.test(r)
          ? new Date(+r.slice(0,4), +r.slice(5,7)-1, +r.slice(8,10))
          : new Date(r));
        return parseRaw(a.dueDateRaw!).getTime() - parseRaw(b.dueDateRaw!).getTime();
      })
      .slice(0, 5)
      .map((project) => {
        const raw = project.dueDateRaw!;
        const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(raw)
          ? new Date(+raw.slice(0,4), +raw.slice(5,7)-1, +raw.slice(8,10))
          : new Date(raw);
        return {
          id: project.id,
          title: project.title,
          subtitle: project.description.slice(0, 50),
          date: dueDate,
          status: project.status,
          priority: project.priority,
        };
      });
  }, [projects]);

  // Calculate status counts
  const statusCounts: StatusCount = useMemo(
    () => ({
      planning: projects.filter((p) => p.status === "planning").length,
      inProgress: projects.filter((p) => p.status === "in_progress").length,
      onHold: projects.filter((p) => p.status === "on_hold").length,
      completed: projects.filter((p) => p.status === "completed").length,
    }),
    [projects]
  );

  const shiftMonth = (offset: number) => {
    const baseDate = new Date(currentYear, currentMonth, 1);
    baseDate.setMonth(baseDate.getMonth() + offset);
    setCurrentMonth(baseDate.getMonth());
    setCurrentYear(baseDate.getFullYear());
    onCurrentDateChange?.(baseDate);
  };

  const handlePrevMonth = () => {
    shiftMonth(-1);
  };

  const handleNextMonth = () => {
    shiftMonth(1);
  };

  const handleToday = () => {
    const nextDate = new Date();
    setCurrentMonth(nextDate.getMonth());
    setCurrentYear(nextDate.getFullYear());
    setSelectedDate(nextDate);
    onCurrentDateChange?.(nextDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onCurrentDateChange?.(date);
  };

  const handleEventClick = (event: ProjectCalendarEvent) => {
    if (onProjectClick) {
      onProjectClick(event.project);
    }
  };

  const handleDeadlineClick = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project && onProjectClick) {
      onProjectClick(project);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <div className="flex-1 flex gap-3 min-h-0 mt-2">
        {/* Main Calendar */}
        <div className="flex-1 min-w-0 bg-white rounded-[12px] shadow-sm border border-neutral-100 overflow-hidden flex flex-col">
          <CalendarGrid
            days={calendarDays}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onEventClick={handleEventClick}
          />
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex w-[240px] xl:w-[260px] shrink-0 flex-col gap-3 overflow-y-auto">
          <MiniCalendar
            year={currentYear}
            month={currentMonth}
            days={calendarDays}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
          <UpcomingDeadlines deadlines={upcomingDeadlines} onDeadlineClick={handleDeadlineClick} />
          <StatusOverview status={statusCounts} />
        </aside>
      </div>
    </div>
  );
}
