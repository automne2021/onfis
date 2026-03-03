import type { StatusCount } from "./types";

interface StatusOverviewProps {
  status: StatusCount;
}

export default function StatusOverview({ status }: StatusOverviewProps) {
  const items = [
    { label: "Completed", count: status.completed, color: "bg-action-success" },
    { label: "In Progress", count: status.inProgress, color: "bg-primary" },
    { label: "To Do", count: status.toDo, color: "bg-priority-high" },
  ];

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-100">
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">Status Overview</h3>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-sm text-neutral-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
