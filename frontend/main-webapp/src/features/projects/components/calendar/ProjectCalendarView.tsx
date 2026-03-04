import { useState, useMemo } from "react";
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
}

export default function ProjectCalendarView({ projects, onProjectClick }: ProjectCalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

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
        const dueDate = new Date(project.dueDate);
        return dueDate >= now && dueDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((project) => ({
        id: project.id,
        title: project.title,
        subtitle: project.description.slice(0, 50) + "...",
        date: new Date(project.dueDate),
        status: project.status,
        priority: project.priority,
      }));
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

  const handleEventClick = (event: ProjectCalendarEvent) => {
    if (onProjectClick) {
      onProjectClick(event.project);
    }
  };

  const handleDeadlineClick = (deadline: UpcomingDeadline) => {
    const project = projects.find((p) => p.id === deadline.id);
    if (project && onProjectClick) {
      onProjectClick(project);
    }
  };

  return (
    <div className="flex gap-3 h-full">
      {/* Main Calendar */}
      <div className="flex-1 bg-white rounded-[12px] shadow-sm border border-neutral-100 overflow-hidden flex flex-col">
        <CalendarHeader
          year={currentYear}
          month={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
        <CalendarGrid
          days={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-[240px] shrink-0 flex flex-col gap-3">
        <MiniCalendar
          year={currentYear}
          month={currentMonth}
          days={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        <UpcomingDeadlines deadlines={upcomingDeadlines} onDeadlineClick={handleDeadlineClick} />
        <StatusOverview counts={statusCounts} />
      </div>
    </div>
  );
}
