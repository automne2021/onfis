import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import KPICards from "../components/KPICards";
import DepartmentWorkload from "../components/DepartmentWorkload";
import CriticalAlerts from "../components/CriticalAlerts";
import QuickActions from "../components/QuickActions";

interface DashboardData {
  totalEmployees: number;
  activeProjects: number;
  totalProjects: number;
  onTimeRate: number;
  pendingApprovals: number;
  departments: { name: string; load: number; maxLoad: number }[];
  alerts: { id: string; type: "overdue" | "pending" | "bottleneck"; title: string; description: string; severity: "high" | "medium" | "low"; createdAt: string }[];
}

export default function LeaderDashboardPage() {
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();
  const [data, setData] = useState<DashboardData>({
    totalEmployees: 0,
    activeProjects: 0,
    totalProjects: 0,
    onTimeRate: 0,
    pendingApprovals: 0,
    departments: [],
    alerts: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API calls
      // For now, use mock data to demonstrate the UI
      await new Promise((resolve) => setTimeout(resolve, 800));

      setData({
        totalEmployees: 47,
        activeProjects: 12,
        totalProjects: 18,
        onTimeRate: 78,
        pendingApprovals: 5,
        departments: [
          { name: "Kỹ thuật (IT)", load: 85, maxLoad: 100 },
          { name: "Kinh doanh", load: 72, maxLoad: 100 },
          { name: "Marketing", load: 58, maxLoad: 100 },
          { name: "Nhân sự", load: 42, maxLoad: 100 },
          { name: "Kế toán", load: 35, maxLoad: 100 },
          { name: "Hành chính", load: 20, maxLoad: 100 },
        ],
        alerts: [
          {
            id: "1",
            type: "overdue",
            title: "Dự án Website Redesign trễ hạn 3 ngày",
            description: "Milestone Q2 chưa hoàn thành. 4 task đang blocked.",
            severity: "high",
            createdAt: "2026-04-21T10:00:00Z",
          },
          {
            id: "2",
            type: "pending",
            title: "Yêu cầu phê duyệt ngân sách Marketing Q3",
            description: "Chờ duyệt từ ngày 19/04. Tổng: 150,000,000đ",
            severity: "medium",
            createdAt: "2026-04-19T14:00:00Z",
          },
          {
            id: "3",
            type: "bottleneck",
            title: "Phòng IT quá tải - 85% capacity",
            description: "3 dự án đồng thời, cần phân bổ lại nguồn lực.",
            severity: "high",
            createdAt: "2026-04-22T08:00:00Z",
          },
        ],
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bảng điều khiển CEO</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Tổng quan toàn cảnh doanh nghiệp</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/${tenant}/delegation`)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 btn-hover shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tạo ủy quyền
          </button>
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
