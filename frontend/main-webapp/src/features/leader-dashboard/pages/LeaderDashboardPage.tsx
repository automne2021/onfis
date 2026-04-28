import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import KPICards from "../components/KPICards";
import Icon from "../../../components/common/Icon";
import DepartmentWorkload from "../components/DepartmentWorkload";
import CriticalAlerts from "../components/CriticalAlerts";
import QuickActions from "../components/QuickActions";
import { Button } from "../../../components/common/Buttons/Button";
import { getLeaderDashboardData, type LeaderDashboardData } from "../services/leaderDashboardService";

const FALLBACK_DASHBOARD_DATA: LeaderDashboardData = {
  totalEmployees: 0,
  activeProjects: 0,
  totalProjects: 0,
  onTimeRate: 0,
  pendingApprovals: 0,
  departments: [],
  alerts: [],
};

function LeaderDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse w-full h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-neutral-200 rounded mb-2" />
          <div className="h-4 w-32 bg-neutral-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-neutral-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-neutral-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-80 bg-neutral-100 rounded-2xl" />
        <div className="lg:col-span-2 h-80 bg-neutral-100 rounded-2xl" />
      </div>
      <div className="h-32 bg-neutral-100 rounded-2xl" />
    </div>
  );
}

export default function LeaderDashboardPage() {
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();
  const [data, setData] = useState<LeaderDashboardData>(FALLBACK_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await getLeaderDashboardData();
      setData(dashboardData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setData(FALLBACK_DASHBOARD_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LeaderDashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">CEO Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Enterprise overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            title="Create Delegation"
            iconLeft={<Icon name="add" size={20} color="currentColor" />}
            onClick={() => navigate(`/${tenant}/delegation`)}
            style="primary"
            textStyle="body-4-medium"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards
        totalEmployees={data.totalEmployees}
        activeProjects={data.activeProjects}
        totalProjects={data.totalProjects}
        onTimeRate={data.onTimeRate}
        pendingApprovals={data.pendingApprovals}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Department Workload (wider) */}
        <div className="lg:col-span-3">
          <DepartmentWorkload departments={data.departments} />
        </div>

        {/* Critical Alerts */}
        <div className="lg:col-span-2">
          <CriticalAlerts alerts={data.alerts} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions tenant={tenant || ""} />
    </div>
  );
}
