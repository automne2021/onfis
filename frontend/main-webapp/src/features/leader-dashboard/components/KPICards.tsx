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
    label: "Tổng nhân sự",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    shadowColor: "shadow-blue-500/20",
  },
  {
    key: "projects" as const,
    label: "Dự án đang hoạt động",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    key: "ontime" as const,
    label: "Tỷ lệ đúng hạn",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    shadowColor: "shadow-amber-500/20",
  },
  {
    key: "approvals" as const,
    label: "Chờ phê duyệt",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
    shadowColor: "shadow-violet-500/20",
  },
];

export default function KPICards({ totalEmployees, activeProjects, totalProjects, onTimeRate, pendingApprovals }: KPICardsProps) {
  const values: Record<string, { value: string; sub?: string }> = {
    employees: { value: totalEmployees.toString(), sub: "người đang hoạt động" },
    projects: { value: `${activeProjects}`, sub: `trên tổng ${totalProjects} dự án` },
    ontime: { value: `${onTimeRate}%`, sub: onTimeRate >= 80 ? "Tốt" : onTimeRate >= 60 ? "Cần cải thiện" : "Cảnh báo" },
    approvals: { value: pendingApprovals.toString(), sub: "yêu cầu đang chờ" },
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
