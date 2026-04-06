import type { ProjectTimelineItem } from "./types";
import { formatDate } from "./timelineUtils";
import { CloseIcon, FlagIconGantt as FlagIcon } from "../../../../components/common/Icons";

interface ProjectTimelineDetailPanelProps {
  project: ProjectTimelineItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  planning: { bg: "bg-status-on_hold/15", text: "text-status-on_hold" },
  in_progress: { bg: "bg-primary/15", text: "text-primary" },
  on_hold: { bg: "bg-status-off_track/15", text: "text-status-off_track" },
  completed: { bg: "bg-status-done/15", text: "text-status-done" },
};

const statusLabels: Record<string, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
};

const priorityColors: Record<string, string> = {
  urgent: "text-priority-urgent",
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
};

const avatarColors = [
  "bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-primary",
];

function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

export default function ProjectTimelineDetailPanel({
  project,
  isOpen,
  onClose,
}: ProjectTimelineDetailPanelProps) {
  if (!project || !isOpen) return null;

  const statusColor = statusColors[project.status] ?? { bg: "bg-neutral-100", text: "text-neutral-600" };
  const statusLabel = statusLabels[project.status] ?? project.status;

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-neutral-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b border-neutral-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h2 className="text-sm font-semibold text-neutral-900 truncate">
              {project.title}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {project.slug} • Start {formatDate(project.startDate)}
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
        {/* Priority & Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Priority
            </label>
            <div className="mt-1 flex items-center gap-1.5">
              <FlagIcon className={priorityColors[project.priority ?? "medium"]} />
              <span className={`text-sm font-medium capitalize ${priorityColors[project.priority ?? "medium"]}`}>
                {project.priority ?? "Medium"}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Due Date
            </label>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {formatDate(project.endDate)}
            </p>
          </div>
        </div>

        {/* Assignees */}
        {project.assignees && project.assignees.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Assignees
            </label>
            <div className="mt-2 space-y-2">
              {project.assignees.map((assignee) => (
                <div key={assignee.id} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden ${
                      assignee.avatar ? "" : getAvatarColor(assignee.name)
                    }`}
                  >
                    {assignee.avatar ? (
                      <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
                    ) : (
                      assignee.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium text-neutral-900">{assignee.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Progress
            </label>
            <span className="text-xs font-semibold text-neutral-900">{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Description
          </label>
          <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
            {project.description
              ? <span dangerouslySetInnerHTML={{ __html: project.description }} />
              : "No description available."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end p-3 border-t border-neutral-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
