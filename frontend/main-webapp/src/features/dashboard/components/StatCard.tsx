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
    <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 px-3 py-2 flex flex-col gap-1 aspect-[10/6] card-hover">
      {/* Header: Icon + Badge */}
      <div className="flex items-start justify-between">
        {/* Icon Container */}
        <div className="bg-secondary rounded-md p-1.5 flex items-center justify-center">
          {icon}
        </div>

        {/* Badge (if exists) */}
        {badge && (
          <div
            className={`px-2 py-0.5 rounded-[10px] ${badgeStyles[badge.variant]}`}
          >
            <span className="font-medium text-xs leading-4">
              {badge.text}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="font-medium text-sm leading-5 text-neutral-500 mt-auto">
        {label}
      </p>

      {/* Value + Subtitle */}
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="font-bold text-xl leading-6 text-neutral-900">
          {value}
        </span>
        {subtitle && (
          <span className="font-medium text-xs leading-4 text-neutral-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
