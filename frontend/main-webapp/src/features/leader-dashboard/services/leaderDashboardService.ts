import api from "../../../services/api";

export interface LeaderDashboardData {
  totalEmployees: number;
  activeProjects: number;
  totalProjects: number;
  onTimeRate: number;
  pendingApprovals: number;
  departments: { name: string; load: number; maxLoad: number }[];
  alerts: {
    id: string;
    type: "overdue" | "pending" | "bottleneck";
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    createdAt: string;
  }[];
}

export async function getLeaderDashboardData(): Promise<LeaderDashboardData> {
  const { data } = await api.get<LeaderDashboardData>("/admin/leader-dashboard");
  return data;
}
