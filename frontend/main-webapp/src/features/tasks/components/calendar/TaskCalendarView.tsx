import { useState, useMemo } from "react";
import type { ViewMode } from "../../types";
import type { CalendarEvent, UpcomingDeadline, StatusCount } from "./types";
import { getCalendarDays } from "./calendarUtils";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import MiniCalendar from "./MiniCalendar";
import UpcomingDeadlines from "./UpcomingDeadlines";
import StatusOverview from "./StatusOverview";

interface TaskCalendarViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

// Mock data matching the Figma design (October 2023)
const mockEvents: CalendarEvent[] = [
  { id: "1", title: "Competitor A...", date: new Date(2023, 9, 2), color: "warning", dueTime: "Due 5pm" },
  { id: "2", title: "Sprint Planning", date: new Date(2023, 9, 4), color: "primary" },
  { id: "3", title: "Team Lunch", date: new Date(2023, 9, 5), color: "success" },
  { id: "4", title: "Wireframe R...", date: new Date(2023, 9, 8), color: "info" },
  { id: "5", title: "Frontend Development - Phase 1", date: new Date(2023, 9, 10), color: "primary" },
  { id: "6", title: "Bug Bash", date: new Date(2023, 9, 12), color: "error" },
  { id: "7", title: "Milestone: Alp...", date: new Date(2023, 9, 15), color: "info" },
  { id: "8", title: "Content Audit", date: new Date(2023, 9, 17), color: "neutral" },
  { id: "9", title: "SEO Check", date: new Date(2023, 9, 17), color: "neutral" },
  { id: "10", title: "Extra Task 1", date: new Date(2023, 9, 17), color: "primary" },
  { id: "11", title: "Extra Task 2", date: new Date(2023, 9, 17), color: "success" },
  { id: "12", title: "Client Prese...", date: new Date(2023, 9, 24), color: "warning" },
  { id: "13", title: "Asset Handoff", date: new Date(2023, 9, 26), color: "purple" },
  { id: "14", title: "Monthly Revi...", date: new Date(2023, 9, 31), color: "primary" },
];

const mockDeadlines: UpcomingDeadline[] = [
  {
    id: "d1",
    title: "Client Presentation",
    subtitle: "Project Management",
    date: new Date(2023, 9, 24),
    time: "2:00 PM",
  },
  {
    id: "d2",
    title: "Asset Handoff",
    subtitle: "Design Team",
    date: new Date(2023, 9, 26),
    time: "5:00 PM",
  },
  {
    id: "d3",
    title: "Monthly Review",
    subtitle: "All Hands",
    date: new Date(2023, 9, 31),
    time: "10:00 AM",
  },
];

const mockStatus: StatusCount = {
  completed: 12,
  inProgress: 5,
  toDo: 8,
};

export default function TaskCalendarView({ viewMode, onViewModeChange }: TaskCalendarViewProps) {
  const today = new Date();
  // For demo, start with October 2023 to match Figma design
  const [currentMonth, setCurrentMonth] = useState(9); // October (0-indexed)
  const [currentYear, setCurrentYear] = useState(2023);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2023, 9, 15));

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth, mockEvents),
    [currentYear, currentMonth]
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
    console.log("Day clicked:", date);
  };

  const handleEventClick = (eventId: string) => {
    console.log("Event clicked:", eventId);
  };

  const handleDeadlineClick = (deadlineId: string) => {
    console.log("Deadline clicked:", deadlineId);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto">
      {/* Header with tabs and month navigation */}
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        viewMode={viewMode}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onViewModeChange={onViewModeChange}
        onFilter={() => console.log("Filter clicked")}
        onSettings={() => console.log("Settings clicked")}
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
            deadlines={mockDeadlines}
            onViewAll={() => console.log("View all deadlines")}
            onDeadlineClick={handleDeadlineClick}
          />
          <StatusOverview status={mockStatus} />
        </aside>
      </div>
    </div>
  );
}
