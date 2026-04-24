interface Alert {
  id: string;
  type: "overdue" | "pending" | "bottleneck";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  createdAt: string;
}

interface CriticalAlertsProps {
  alerts: Alert[];
}

const typeConfig = {
  overdue: { icon: "⏰", label: "Trễ hạn", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  pending: { icon: "⏳", label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  bottleneck: { icon: "🔥", label: "Quá tải", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
};

const severityBadge = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-100 text-neutral-600",
};

export default function CriticalAlerts({ alerts }: CriticalAlertsProps) {
  const formatRelativeTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Cảnh báo trọng điểm</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{alerts.length} vấn đề cần chú ý</p>
        </div>
        {alerts.length > 0 && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-[11px] font-bold">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-3xl">✅</span>
          <p className="text-sm text-neutral-400 mt-2">Không có cảnh báo nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, i) => {
            const config = typeConfig[alert.type];
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${config.border} ${config.bg} hover:shadow-sm transition-all cursor-pointer animate-page-enter`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>
                        {config.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${severityBadge[alert.severity]}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-800 leading-snug">{alert.title}</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{alert.description}</p>
                    <p className="text-[10px] text-neutral-400 mt-2">{formatRelativeTime(alert.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
