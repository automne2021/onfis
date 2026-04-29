import api from "../../../services/api";
import { getCachedResource, setCachedResource } from "../../../utils/resourceCache";

type CacheOptions = {
  forceRefresh?: boolean;
};

const LEADER_DASHBOARD_CACHE_KEY = "leader:dashboard";
const LEADER_DASHBOARD_CACHE_TTL_MS = 60_000;

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

export function getCachedLeaderDashboardData(): LeaderDashboardData | null {
  return getCachedResource<LeaderDashboardData>(LEADER_DASHBOARD_CACHE_KEY);
}

export async function getLeaderDashboardData(options?: CacheOptions): Promise<LeaderDashboardData> {
  if (!options?.forceRefresh) {
    const cached = getCachedLeaderDashboardData();
    if (cached) {
      return cached;
    }
  }

  const { data } = await api.get<LeaderDashboardData>("/admin/leader-dashboard");
  setCachedResource(LEADER_DASHBOARD_CACHE_KEY, data, LEADER_DASHBOARD_CACHE_TTL_MS);
  return data;
}
