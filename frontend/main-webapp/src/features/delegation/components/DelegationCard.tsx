import type { ExecutiveRequest } from "../services/delegationService";

interface DelegationCardProps {
  request: ExecutiveRequest;
  onStatusChange?: (id: string, status: ExecutiveRequest["status"]) => void;
  onDelete?: (id: string) => void;
  onViewDetail?: (request: ExecutiveRequest) => void;
}

import Icon from "../../../components/common/Icon";
import { useLanguage } from "../../../contexts/LanguageContext";

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return f + l || "?";
}

function getFullName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  const parts = [user.lastName, user.firstName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
}

export default function DelegationCard({ request, onStatusChange, onDelete, onViewDetail }: DelegationCardProps) {
  const { t } = useLanguage();

  const statusConfig: Record<ExecutiveRequest["status"], { label: string; color: string }> = {
    PENDING: { label: t("Pending"), color: "bg-amber-100 text-amber-700" },
    IN_PROGRESS: { label: t("In Progress"), color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: t("Completed"), color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: t("Cancelled"), color: "bg-neutral-100 text-neutral-500" },
  };

  const priorityConfig: Record<ExecutiveRequest["priority"], { label: string; dot: string }> = {
    URGENT: { label: t("Urgent"), dot: "bg-red-500" },
    HIGH: { label: t("High"), dot: "bg-orange-500" },
    MEDIUM: { label: t("Medium"), dot: "bg-blue-500" },
    LOW: { label: t("Low"), dot: "bg-neutral-400" },
  };

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
    <div
      className="bg-white rounded-xl border border-neutral-200/80 p-5 hover:shadow-md transition-all card-hover cursor-pointer"
      onClick={() => onViewDetail?.(request)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} />
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{priority.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
            {status.label}
          </span>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(request.id); }}
              className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title={t("Delete delegation")}
            >
              <Icon name="delete" size={16} color="currentColor" />
            </button>
          )}
        </div>
      </div>

      <h4 className="text-base font-semibold text-neutral-900 mb-1.5 leading-snug">{request.title}</h4>

      {request.description && (
        <p className="text-sm text-neutral-500 leading-relaxed mb-3 line-clamp-2">{request.description}</p>
      )}

      {/* Assignees */}
      {request.assignees && request.assignees.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-neutral-400 flex-shrink-0">→</span>
          <div className="flex items-center -space-x-1.5">
            {request.assignees.slice(0, 4).map((user) => (
              <div
                key={user.id}
                title={`${getFullName(user)} (${user.role})`}
                className="w-6 h-6 rounded-full border-2 border-white flex-shrink-0"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
              </div>
            ))}
            {request.assignees.length > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[9px] font-bold text-neutral-500 flex-shrink-0">
                +{request.assignees.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-neutral-500 truncate">
            {request.assignees.length === 1
              ? getFullName(request.assignees[0])
              : `${request.assignees.length} ${t("assignees")}`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Fallback: show targetRole if no assignees */}
          {(!request.assignees || request.assignees.length === 0) && request.targetRole && (
            <span className="text-xs text-neutral-400">
              → {request.targetRole === "ADMIN" ? "Admin" : "Manager"}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-400">{formatDate(request.createdAt)}</span>
      </div>

      {/* Quick actions */}
      {request.status === "PENDING" && onStatusChange && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, "CANCELLED"); }}
            className="py-1.5 px-3 rounded-lg text-xs font-medium text-neutral-500 bg-neutral-50 hover:bg-neutral-100 transition-all"
          >
            {t("Cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
