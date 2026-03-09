import type { ReactNode } from "react";

interface BadgeProps {
  text: string;
  variant: "error" | "warning" | "success";
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  badge?: BadgeProps;
}

const badgeStyles = {
  error: "bg-status-off_track/15 text-status-off_track",
  warning: "bg-status-on_track/15 text-status-on_track",
  success: "bg-status-done/15 text-status-done",
};

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  badge,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 px-4 py-3 flex items-center gap-3 card-hover">
      {/* Icon Container */}
      <div className="bg-secondary rounded-lg p-2 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p className="font-medium text-xs leading-4 text-neutral-500">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-bold text-lg leading-6 text-neutral-900">
            {value}
          </span>
          {subtitle && (
            <span className="font-medium text-xs leading-4 text-neutral-400">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Badge (if exists) */}
      {badge && (
        <div
          className={`px-2 py-0.5 rounded-[10px] flex-shrink-0 ${badgeStyles[badge.variant]}`}
        >
          <span className="font-medium text-xs leading-4">
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
}
