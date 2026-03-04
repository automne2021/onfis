import type { TaskPriority } from "../../types";

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const priorityStyles: Record<TaskPriority, { active: string; inactive: string }> = {
  low: {
    active: "bg-priority-low text-white",
    inactive: "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
  },
  medium: {
    active: "bg-priority-medium text-neutral-900",
    inactive: "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
  },
  high: {
    active: "bg-priority-high text-white",
    inactive: "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
  },
  urgent: {
    active: "bg-priority-urgent text-white",
    inactive: "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
  },
};

export default function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-500">Priority</label>
      <div className="flex items-center gap-2">
        {priorities.map((priority) => {
          const isActive = value === priority.value;
          const styles = priorityStyles[priority.value];
          
          return (
            <button
              key={priority.value}
              onClick={() => onChange(priority.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? styles.active : styles.inactive
              }`}
            >
              {priority.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
