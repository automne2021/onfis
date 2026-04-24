import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import ProjectTable from "../components/ProjectTable";
import RecentActivities from "../components/RecentActivities";
import { PieChart, BarChart, LineChart } from "../components/Charts";
import { FolderIcon, TaskIcon, CalendarClockIcon as CalendarIcon } from "../../../components/common/Icons";
import { useRole } from "../../../hooks/useRole";
import { useAuth } from "../../../hooks/useAuth";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { listProjects, getProjectMembers, type ApiProject } from "../../../services/projectService";
import { listMyTasks, type ApiTask } from "../../../services/taskService";
import { getTimeAgo, formatVNDate } from "../../../utils/getTime";

const WORKLOAD_COLORS = ["#0B68F7", "#00A63E", "#FF6900", "#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6"];

export default function DashboardPage() {
  const { dbUser: currentUser, isLoading: isAuthLoading } = useAuth();
  const { isManager, isSuperAdmin } = useRole();
  const { withTenant } = useTenantPath();

  // SUPER_ADMIN should be redirected to the leader dashboard
  if (!isAuthLoading && isSuperAdmin) {
    return <Navigate to={withTenant("/leader-dashboard")} replace />;
  }

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<ApiTask[]>([]);
  const [createdTasks, setCreatedTasks] = useState<ApiTask[]>([]);
  const [teamWorkloadData, setTeamWorkloadData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading || !currentUser?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [projResp, assignedResp] = await Promise.all([
          listProjects(),
          listMyTasks({ tab: "assigned", size: 200 }),
        ]);
        let created: ApiTask[] = [];
        if (isManager) {
          const createdResp = await listMyTasks({ tab: "created", size: 200 });
          created = createdResp.content;
        }

        // Build team workload: aggregate taskCount per member across all projects
        let workload: { label: string; value: number; color: string }[] = [];
        if (isManager && projResp.length > 0) {
          const membersPerProject = await Promise.all(
            projResp.map(p => getProjectMembers(p.id).catch(() => []))
          );
          const totals = new Map<string, { name: string; count: number }>();
          for (const members of membersPerProject) {
            for (const m of members) {
              const existing = totals.get(m.id);
              if (existing) {
                existing.count += m.taskCount;
              } else {
                totals.set(m.id, { name: m.name, count: m.taskCount });
              }
            }
          }
          workload = Array.from(totals.values())
            .filter(u => u.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((u, i) => ({
              label: u.name.split(" ")[0],
              value: u.count,
              color: WORKLOAD_COLORS[i % WORKLOAD_COLORS.length],
            }));
        }

        if (cancelled) return;
        setProjects(projResp);
        setAssignedTasks(assignedResp.content);
        setCreatedTasks(created);
        setTeamWorkloadData(workload);
      } catch {
        // keep empty state on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isAuthLoading, currentUser?.id, isManager]);

  const pendingCount = useMemo(
    () => assignedTasks.filter(t => t.status !== "DONE").length,
    [assignedTasks],
  );

  const overdueCount = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return assignedTasks.filter(t => {
      if (!t.dueDate || t.status === "DONE") return false;
      return new Date(t.dueDate) < now;
    }).length;
  }, [assignedTasks]);

  const upcomingTask = useMemo(() => {
    const now = new Date();
    return assignedTasks
      .filter(t => t.dueDate && new Date(t.dueDate) >= now && t.status !== "DONE")
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0] ?? null;
  }, [assignedTasks]);

  const activeProjectCount = useMemo(
    () => projects.filter(p => p.status === "in_progress").length,
    [projects],
  );

  const projectTableData = useMemo(
    () =>
      projects.map(p => ({
        id: p.id,
        name: p.title,
        lastUpdate: p.updatedAt
          ? getTimeAgo(p.updatedAt)
          : p.dueDate
          ? formatVNDate(p.dueDate)
          : "-",
        status: p.status,
        progress: p.progress,
      })),
    [projects],
  );

  const recentActivities = useMemo(() => {
    const allTasks = [...assignedTasks, ...createdTasks];
    const seen = new Set<string>();
    const unique = allTasks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    return unique
      .filter(t => t.updatedAt)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        user: currentUser?.name ?? "You",
        action: t.status === "DONE" ? "completed" : "updated",
        target: t.title,
        time: getTimeAgo(t.updatedAt!),
      }));
  }, [assignedTasks, createdTasks, currentUser?.name]);

  const taskStatusChartData = useMemo(() => {
    const counts: Record<string, number> = {
      TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, BLOCKED: 0, DONE: 0,
    };
    assignedTasks.forEach(t => {
      if (t.status in counts) counts[t.status]++;
    });
    return [
      { label: "To Do",       value: counts.TODO,        color: "#90A1B9" },
      { label: "In Progress", value: counts.IN_PROGRESS, color: "#0B68F7" },
      { label: "In Review",   value: counts.IN_REVIEW,   color: "#FF6900" },
      { label: "Blocked",     value: counts.BLOCKED,     color: "#E7000B" },
      { label: "Done",        value: counts.DONE,        color: "#00A63E" },
    ].filter(d => d.value > 0);
  }, [assignedTasks]);

  const weeklyTasksChartData = useMemo(() => {
    const allTasks = [...assignedTasks, ...createdTasks];
    const seen = new Set<string>();
    const doneTasks = allTasks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return t.status === "DONE" && !!t.updatedAt;
    });
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const count = doneTasks.filter(t => {
        const updated = new Date(t.updatedAt!);
        return updated >= date && updated < nextDate;
      }).length;
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        value: count,
      };
    });
  }, [assignedTasks, createdTasks]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 w-full bg-white rounded-[12px] shadow-md border-2 border-neutral-200 p-4 animate-pulse">
        <div className="h-6 w-48 bg-neutral-200 rounded" />
        <div className={`grid gap-3 ${isManager ? "grid-cols-3" : "grid-cols-2"}`}>
          {Array.from({ length: isManager ? 3 : 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full bg-white rounded-[12px] shadow-md border-2 border-neutral-200 p-4 ">
      {/* Greeting */}
      <h1 className="font-bold text-lg leading-[22px] text-neutral-900">
        Good morning, {currentUser?.name ?? ""}
      </h1>

      {/* Stats Cards Row */}
      <div className={`grid gap-3 ${isManager ? "grid-cols-3" : "grid-cols-2"}`}>
        {isManager && (
          <StatCard
            icon={<FolderIcon />}
            label="Total Projects"
            value={`${activeProjectCount} Active`}
            subtitle={`/ ${projects.length} Total`}
          />
        )}
        <StatCard
          icon={<TaskIcon />}
          label="Pending Tasks"
          value={`${pendingCount} Pending`}
          badge={overdueCount > 0 ? { text: `${overdueCount} Overdue`, variant: "error" } : undefined}
        />
        <StatCard
          icon={<CalendarIcon />}
          label="Upcoming Deadline"
          value={upcomingTask ? upcomingTask.title : "None"}
          subtitle={
            upcomingTask?.dueDate
              ? `Due ${formatVNDate(upcomingTask.dueDate)}`
              : upcomingTask
              ? "No due date"
              : "No upcoming deadlines"
          }
          badge={upcomingTask?.priority === "urgent" ? { text: "Urgent", variant: "error" } : undefined}
        />
      </div>

      {/* Charts Row — manager only */}
      {isManager && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <PieChart
              data={taskStatusChartData}
              title="Task Status Overview"
            />
            <LineChart
              data={weeklyTasksChartData}
              title="Tasks Completed This Week"
              color="#0014A8"
            />
          </div>
          {teamWorkloadData.length > 0 && (
            <BarChart
              data={teamWorkloadData}
              title="Team Workload"
            />
          )}
        </>
      )}

      {/* Main Content: Projects Table (70%) + Activities (30%) */}
      <div className="flex gap-3 w-full">
        {/* Projects Table Section - 70% width */}
        <div className="w-[70%] flex flex-col min-w-0">
          <div className="flex items-center justify-between py-2">
            <h2 className="font-bold text-lg leading-[22px] text-neutral-900">
              Enrolled Projects
            </h2>
          </div>
          <ProjectTable projects={projectTableData} />
        </div>

        {/* Recent Activities Section - 30% width */}
        <div className="w-[30%] flex flex-col min-w-[200px]">
          <h2 className="font-bold text-lg leading-[22px] text-neutral-900 py-2">
            Recent Activities
          </h2>
          <RecentActivities activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}

