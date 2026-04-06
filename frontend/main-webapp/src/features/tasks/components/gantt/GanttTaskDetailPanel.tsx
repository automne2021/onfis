import type { GanttTask } from "./types";
import { statusColors, statusLabels } from "./types";
import { formatDate } from "./ganttUtils";
import { CloseIcon, CheckIcon, FlagIconGantt as FlagIcon, PlusIcon } from "../../../../components/common/Icons";

interface GanttTaskDetailPanelProps {
  task: GanttTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: GanttTask) => void;
}

export default function GanttTaskDetailPanel({
  task,
  isOpen,
  onClose,
  onSave,
}: GanttTaskDetailPanelProps) {
  if (!task || !isOpen) return null;

  const statusLabel = statusLabels[task.status];

  // Generate avatar color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
      "bg-primary",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const priorityColors = {
    urgent: "text-priority-urgent",
    high: "text-priority-high",
    medium: "text-priority-medium",
    low: "text-priority-low",
  };

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-neutral-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b border-neutral-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold text-neutral-900 truncate">
              {task.name}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status].bg} ${statusColors[task.status].text}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {task.taskKey || "TASK"} • Start {formatDate(task.startDate)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Project & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Project
            </label>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {task.projectName || "Project"}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Priority
            </label>
            <div className="mt-1 flex items-center gap-1.5">
              <FlagIcon className={priorityColors[task.priority || "medium"]} />
              <span className={`text-sm font-medium capitalize ${priorityColors[task.priority || "medium"]}`}>
                {task.priority || "Medium"}
              </span>
            </div>
          </div>
        </div>

        {/* Assignee & Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Assignee
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden ${task.owner.avatar ? "" : getAvatarColor(task.owner.name)
                  }`}
              >
                {task.owner.avatar ? (
                  <img
                    src={task.owner.avatar}
                    alt={task.owner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitial(task.owner.name)
                )}
              </div>
              <span className="text-sm font-medium text-neutral-900">
                {task.owner.name}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Due Date
            </label>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {formatDate(task.endDate)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Description
          </label>
          <div
            className="mt-2 text-sm text-neutral-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: task.description || "<p>No description available.</p>" }}
          />
        </div>

        {/* Sub-tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Sub-tasks ({task.subTasks?.filter(s => s.completed).length || 3}/{task.subTasks?.length || 5})
            </label>
            <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
              <PlusIcon />
              Add Sub-task
            </button>
          </div>
          <div className="space-y-2">
            {(task.subTasks || [
              { id: "1", title: "Environment Setup", completed: true },
              { id: "2", title: "Router Configuration", completed: true },
              { id: "3", title: "Component Architecture", completed: false },
            ]).map((subTask) => (
              <div
                key={subTask.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${subTask.completed
                      ? "bg-primary text-white"
                      : "border-2 border-neutral-300"
                      }`}
                  >
                    {subTask.completed && <CheckIcon />}
                  </div>
                  <span
                    className={`text-sm ${subTask.completed
                      ? "text-neutral-400 line-through"
                      : "text-neutral-900"
                      }`}
                  >
                    {subTask.title}
                  </span>
                </div>
                {subTask.assignee && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(
                      subTask.assignee.name
                    )}`}
                    title={subTask.assignee.name}
                  >
                    {getInitial(subTask.assignee.name)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 p-3 border-t border-neutral-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave?.(task)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
