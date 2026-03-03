import StatCard from "../components/StatCard";
import ProjectTable from "../components/ProjectTable";
import RecentActivities from "../components/RecentActivities";
import { FolderIcon, TaskIcon, CalendarClockIcon as CalendarIcon } from "../../../components/common/Icons";

// Mock data - replace with real data from API
const mockProjects = [
  {
    id: "1",
    name: "ABC Website Redesign",
    lastUpdate: "15:00 Sep 10th, 2026",
    status: "completed" as const,
    progress: 100,
  },
  {
    id: "2",
    name: "Mobile App Development",
    lastUpdate: "14:30 Sep 10th, 2026",
    status: "in_progress" as const,
    progress: 75,
  },
  {
    id: "3",
    name: "E-commerce Platform",
    lastUpdate: "12:00 Sep 9th, 2026",
    status: "on_hold" as const,
    progress: 45,
  },
  {
    id: "4",
    name: "CRM Integration",
    lastUpdate: "10:00 Sep 9th, 2026",
    status: "planning" as const,
    progress: 0,
  },
  {
    id: "5",
    name: "Data Analytics Dashboard",
    lastUpdate: "09:00 Sep 8th, 2026",
    status: "in_progress" as const,
    progress: 60,
  },
  {
    id: "6",
    name: "Payment Gateway Setup",
    lastUpdate: "16:00 Sep 7th, 2026",
    status: "completed" as const,
    progress: 100,
  },
  {
    id: "7",
    name: "User Authentication System",
    lastUpdate: "11:00 Sep 7th, 2026",
    status: "in_progress" as const,
    progress: 85,
  },
  {
    id: "8",
    name: "API Documentation",
    lastUpdate: "15:00 Sep 6th, 2026",
    status: "completed" as const,
    progress: 100,
  },
  {
    id: "9",
    name: "Cloud Migration",
    lastUpdate: "14:00 Sep 5th, 2026",
    status: "on_hold" as const,
    progress: 30,
  },
  {
    id: "10",
    name: "Security Audit",
    lastUpdate: "13:00 Sep 4th, 2026",
    status: "planning" as const,
    progress: 10,
  },
  {
    id: "11",
    name: "Performance Optimization",
    lastUpdate: "12:00 Sep 3rd, 2026",
    status: "in_progress" as const,
    progress: 50,
  },
  {
    id: "12",
    name: "Database Restructuring",
    lastUpdate: "11:00 Sep 2nd, 2026",
    status: "completed" as const,
    progress: 100,
  },
  {
    id: "13",
    name: "UI/UX Improvements",
    lastUpdate: "10:00 Sep 1st, 2026",
    status: "in_progress" as const,
    progress: 40,
  },
  {
    id: "14",
    name: "Testing Automation",
    lastUpdate: "09:00 Aug 31st, 2026",
    status: "planning" as const,
    progress: 5,
  },
  {
    id: "15",
    name: "DevOps Pipeline",
    lastUpdate: "08:00 Aug 30th, 2026",
    status: "on_hold" as const,
    progress: 20,
  },
];

const mockActivities = [
  {
    id: "1",
    user: "Nhan",
    action: "commented on",
    target: "Design",
    time: "2 hours ago",
  },
  {
    id: "2",
    user: "Nhan",
    action: "commented on",
    target: "Design",
    time: "2 hours ago",
  },
  {
    id: "3",
    user: "Nhan",
    action: "commented on",
    target: "Design",
    time: "2 hours ago",
  },
  {
    id: "4",
    user: "Nhan",
    action: "commented on",
    target: "Design",
    time: "2 hours ago",
  },
];

export default function DashboardPage() {
  // TODO: Replace with actual user name from auth context
  const userName = "Nhan";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Greeting */}
      <h1 className="font-bold text-lg leading-[22px] text-neutral-900">
        Good morning, {userName}
      </h1>

      {/* Stats Cards Row - Always 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<FolderIcon />}
          label="Total Projects"
          value="4 Active"
          subtitle="/ 12 Total"
        />
        <StatCard
          icon={<TaskIcon />}
          label="Pending Tasks"
          value="8 Pending"
          badge={{ text: "2 Overdue", variant: "error" }}
        />
        <StatCard
          icon={<CalendarIcon />}
          label="Upcoming Deadline"
          value="Design"
          subtitle="Due Tomorrow, 5:00 PM"
          badge={{ text: "Urgent", variant: "error" }}
        />
      </div>

      {/* Main Content: Projects Table (70%) + Activities (30%) */}
      <div className="flex gap-3 w-full">
        {/* Projects Table Section - 70% width */}
        <div className="w-[70%] flex flex-col min-w-0">
          <div className="flex items-center justify-between py-2">
            <h2 className="font-bold text-lg leading-[22px] text-neutral-900">
              Enrolled Projects
            </h2>
          </div>
          <ProjectTable projects={mockProjects} />
        </div>

        {/* Recent Activities Section - 30% width */}
        <div className="w-[30%] flex flex-col min-w-[200px]">
          <h2 className="font-bold text-lg leading-[22px] text-neutral-900 py-2">
            Recent Activities
          </h2>
          <RecentActivities activities={mockActivities} />
        </div>
      </div>
    </div>
  );
}
