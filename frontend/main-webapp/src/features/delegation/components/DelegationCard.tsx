import type { ExecutiveRequest } from "../services/delegationService";

interface DelegationCardProps {
  request: ExecutiveRequest;
  onStatusChange?: (id: string, status: ExecutiveRequest["status"]) => void;
}

const statusConfig: Record<ExecutiveRequest["status"], { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-neutral-100 text-neutral-500" },
};

const priorityConfig: Record<ExecutiveRequest["priority"], { label: string; dot: string }> = {
  URGENT: { label: "Khẩn cấp", dot: "bg-red-500" },
  HIGH: { label: "Cao", dot: "bg-orange-500" },
  MEDIUM: { label: "Trung bình", dot: "bg-blue-500" },
  LOW: { label: "Thấp", dot: "bg-neutral-400" },
};

export default function DelegationCard({ request, onStatusChange }: DelegationCardProps) {
  const status = statusConfig[request.status];
  const priority = priorityConfig[request.priority];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-5 hover:shadow-md transition-all card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} />
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{priority.label}</span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.color}`}>
          {status.label}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-neutral-900 mb-1.5 leading-snug">{request.title}</h4>

      {request.description && (
        <p className="text-xs text-neutral-500 leading-relaxed mb-3 line-clamp-2">{request.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {request.targetRole && (
            <span className="text-[11px] text-neutral-400">
              → {request.targetRole === "ADMIN" ? "Admin" : "Manager"}
            </span>
          )}
        </div>
        <span className="text-[10px] text-neutral-400">{formatDate(request.createdAt)}</span>
      </div>

      {/* Quick actions */}
      {request.status === "PENDING" && onStatusChange && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100">
          <button
            onClick={() => onStatusChange(request.id, "IN_PROGRESS")}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
          >
            Bắt đầu xử lý
          </button>
          <button
            onClick={() => onStatusChange(request.id, "CANCELLED")}
            className="py-1.5 px-3 rounded-lg text-[11px] font-medium text-neutral-500 bg-neutral-50 hover:bg-neutral-100 transition-all"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
