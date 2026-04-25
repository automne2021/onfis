import Icon from "../../../components/common/Icon";

interface KPICardsProps {
  totalEmployees: number;
  activeProjects: number;
  totalProjects: number;
  onTimeRate: number;
  pendingApprovals: number;
}

const kpiConfig = [
  {
    key: "employees" as const,
    label: "Total Employees",
    icon: <Icon name="group" size={24} color="currentColor" />,
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    shadowColor: "shadow-blue-500/20",
  },
  {
    key: "projects" as const,
    label: "Active Projects",
    icon: <Icon name="folder_open" size={24} color="currentColor" />,
    color: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    key: "ontime" as const,
    label: "On-time Rate",
    icon: <Icon name="pie_chart" size={24} color="currentColor" />,
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    shadowColor: "shadow-amber-500/20",
  },
  {
    key: "approvals" as const,
    label: "Pending Approvals",
    icon: <Icon name="checklist" size={24} color="currentColor" />,
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
    shadowColor: "shadow-violet-500/20",
  },
];

export default function KPICards({ totalEmployees, activeProjects, totalProjects, onTimeRate, pendingApprovals }: KPICardsProps) {
  const values: Record<string, { value: string; sub?: string }> = {
    employees: { value: totalEmployees.toString(), sub: "active people" },
    projects: { value: `${activeProjects}`, sub: `out of ${totalProjects} total projects` },
    ontime: { value: `${onTimeRate}%`, sub: onTimeRate >= 80 ? "Good" : onTimeRate >= 60 ? "Needs Improvement" : "Warning" },
    approvals: { value: pendingApprovals.toString(), sub: "pending requests" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map((kpi, index) => {
        const v = values[kpi.key];
        return (
          <div
            key={kpi.key}
            className={`relative overflow-hidden bg-white rounded-2xl border border-neutral-200/80 p-5 card-hover animate-page-enter`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.color}`} />

            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${kpi.bgLight} flex items-center justify-center ${kpi.textColor}`}>
                {kpi.icon}
              </div>
              {kpi.key === "approvals" && pendingApprovals > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-bold animate-pulse">
                  {pendingApprovals}
                </span>
              )}
            </div>

            <div className="text-3xl font-bold text-neutral-900 mb-1">
              {v.value}
            </div>
            <div className="text-xs text-neutral-500 font-medium">{kpi.label}</div>
            {v.sub && (
              <div className="text-[11px] text-neutral-400 mt-0.5">{v.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
