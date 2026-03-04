import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { TaskDetail, TaskDetailModalProps } from "./types";
import type { Assignee } from "../../types";
import SubTaskList from "./SubTaskList";
import ActivityLog from "./ActivityLog";
import PrioritySelector from "./PrioritySelector";
import StatusSelector from "./StatusSelector";
import AssigneeSelector from "./AssigneeSelector";
import {
  CloseIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  BulletListIcon,
  NumberListIcon,
  LinkIcon,
  ImageIcon,
  CalendarSmallIcon,
} from "../../../../components/common/Icons";
import Button from "../../../../components/common/Button";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/useToast";

// Mock assignee options - would come from API in real app
const mockAssignees: Assignee[] = [
  { id: "1", name: "Sarah Jenkins", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
  { id: "2", name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
  { id: "3", name: "Alice Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
  { id: "4", name: "Bob Wilson" },
];

// Interactive Progress bar with slider
const ProgressBar = ({ progress, onChange, disabled }: { progress: number; onChange?: (value: number) => void; disabled?: boolean }) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    return "bg-primary";
  };

  const getThumbColor = (progress: number) => {
    if (progress >= 75) return "#00A63E";
    if (progress >= 50) return "#3B82F6";
    return "#0014A8";
  };

  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">Progress</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="100"
            value={progress}
            disabled={disabled}
            onChange={(e) => {
              const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
              onChange?.(val);
            }}
            className="w-10 text-right text-sm font-medium text-primary bg-transparent outline-none border-b border-transparent focus:border-primary transition-colors disabled:cursor-not-allowed"
          />
          <span className="text-sm font-medium text-primary">%</span>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getProgressColor(progress)}`}
            style={{ width: `${Math.max(progress, 1)}%` }}
          />
        </div>
        {!disabled && (
          <>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => onChange?.(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ cursor: 'pointer' }}
            />
            {/* Visible thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-200 pointer-events-none"
              style={{
                left: `calc(${progress}% - 8px)`,
                backgroundColor: getThumbColor(progress),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

// Description editor toolbar
const EditorToolbar = ({ disabled }: { disabled?: boolean }) => (
  <div className={`flex items-center gap-1 py-2 px-3 border-b border-neutral-200 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <BoldIcon />
    </button>
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <ItalicIcon />
    </button>
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <StrikethroughIcon />
    </button>
    <div className="w-px h-5 bg-neutral-200 mx-1" />
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <BulletListIcon />
    </button>
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <NumberListIcon />
    </button>
    <div className="w-px h-5 bg-neutral-200 mx-1" />
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <LinkIcon />
    </button>
    <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
      <ImageIcon />
    </button>
  </div>
);

// Effort tracking fields
const EffortFields = ({
  estimatedEffort,
  actualEffort,
  onEstimatedChange,
  onActualChange,
  disabled,
}: {
  estimatedEffort?: number;
  actualEffort?: number;
  onEstimatedChange: (v: number) => void;
  onActualChange: (v: number) => void;
  disabled?: boolean;
}) => {
  const est = estimatedEffort ?? 0;
  const act = actualEffort ?? 0;
  const isOverBudget = act > est && est > 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-500">Effort (hours)</label>
      <div className="flex gap-3">
        <div className="flex-1">
          <span className="text-xs text-neutral-400 mb-1 block">Estimated</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={est || ""}
            disabled={disabled}
            onChange={(e) => onEstimatedChange(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-neutral-400 mb-1 block">Actual</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={act || ""}
            disabled={disabled}
            onChange={(e) => onActualChange(Number(e.target.value) || 0)}
            placeholder="0"
            className={`w-full px-3 py-2 bg-neutral-50 border rounded-lg text-sm outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${isOverBudget
              ? "border-red-300 text-red-600 focus:border-red-500"
              : "border-neutral-200 text-neutral-900 focus:border-primary"
              }`}
          />
        </div>
      </div>
      {isOverBudget && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
          <span>⚠</span>
          <span>Actual effort exceeds estimate by {(act - est).toFixed(1)}h</span>
        </div>
      )}
    </div>
  );
};

// Rejection reason prompt
const RejectionPrompt = ({
  isOpen,
  onReject,
  onCancel,
}: {
  isOpen: boolean;
  onReject: (reason: string) => void;
  onCancel: () => void;
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-amber-800">
        Please provide a reason for rejecting this task:
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain what needs to be revised..."
        className="w-full min-h-[80px] p-3 text-sm text-neutral-900 border border-amber-200 rounded-lg resize-none outline-none focus:border-amber-400 bg-white"
      />
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (reason.trim()) onReject(reason.trim());
          }}
          disabled={!reason.trim()}
        >
          Submit Rejection
        </Button>
      </div>
    </div>
  );
};

export default function TaskDetailModal({
  task: initialTask,
  isOpen,
  onClose,
  onSave,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskDetail>(initialTask);
  const [showRejectionPrompt, setShowRejectionPrompt] = useState(false);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Determine role-based permissions
  const isAssignee = task.assignees.some((a) => a.id === currentUser.id);
  const isReporter = task.reporterId === currentUser.id;
  const isInReview = task.status === "IN_REVIEW";
  const isLockedForAssignee = isInReview && isAssignee && !isReporter;

  // Reset task when modal opens with new data
  useEffect(() => {
    setTask(initialTask);
    setShowRejectionPrompt(false);
  }, [initialTask]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSave = useCallback(() => {
    onSave(task);
    onClose();
  }, [task, onSave, onClose]);

  const handleApprove = useCallback(() => {
    const updated = { ...task, status: "DONE" as const };
    onSave(updated);
    showToast("Task approved and marked as DONE.", "success");
    onClose();
  }, [task, onSave, onClose, showToast]);

  const handleReject = useCallback(
    (reason: string) => {
      const updated = {
        ...task,
        status: "TODO" as const,
        comments: [
          ...task.comments,
          {
            id: `cmt-${Date.now()}`,
            user: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
            content: `[REJECTION] ${reason}`,
            timestamp: "Just now",
          },
        ],
      };
      onSave(updated);
      showToast("Task rejected and returned to TODO.", "warning");
      onClose();
    },
    [task, currentUser, onSave, onClose, showToast]
  );

  // Resolve reporter name from mock assignees
  const reporterAssignee = task.reporterId
    ? mockAssignees.find((a) => a.id === task.reporterId) || { id: task.reporterId, name: `User ${task.reporterId}` }
    : null;

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-6">
        <div
          className="w-full max-w-[900px] xl:max-w-[1000px] max-h-[90vh] bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col animate-slideUp relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-neutral-200 bg-white shrink-0">
            <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 pr-4 truncate">
              {task.title}
            </h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Review Lock-Out Banner */}
          {isLockedForAssignee && (
            <div className="px-6 lg:px-8 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
              <span className="text-amber-600 text-sm">🔒</span>
              <p className="text-sm font-medium text-amber-800">
                This task is under review. Editing is locked until the reviewer takes action.
              </p>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">

            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Left Column - Main Content */}
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Description Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-900">
                    Description
                  </label>
                  <div className={`border border-neutral-200 rounded-xl overflow-hidden ${isLockedForAssignee ? "opacity-60" : ""}`}>
                    <EditorToolbar disabled={isLockedForAssignee} />
                    <textarea
                      value={task.description}
                      disabled={isLockedForAssignee}
                      onChange={(e) =>
                        setTask({ ...task, description: e.target.value })
                      }
                      className="w-full min-h-[100px] p-4 text-sm text-neutral-900 placeholder:text-neutral-400 resize-none outline-none disabled:cursor-not-allowed disabled:bg-neutral-50"
                      placeholder="Add a description..."
                    />
                  </div>
                </div>

                {/* Sub-tasks Section */}
                <SubTaskList
                  subTasks={task.subTasks}
                  onChange={(subTasks) => setTask({ ...task, subTasks })}
                />

                {/* Reviewer Approve/Reject Controls */}
                {isInReview && isReporter && (
                  <div className="flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-medium text-blue-800">
                      This task is awaiting your review.
                    </p>
                    {!showRejectionPrompt && (
                      <div className="flex items-center gap-3">
                        <Button variant="primary" onClick={handleApprove}>
                          ✓ Approve → DONE
                        </Button>
                        <Button variant="ghost" onClick={() => setShowRejectionPrompt(true)}>
                          ✕ Reject → TODO
                        </Button>
                      </div>
                    )}
                    <RejectionPrompt
                      isOpen={showRejectionPrompt}
                      onReject={handleReject}
                      onCancel={() => setShowRejectionPrompt(false)}
                    />
                  </div>
                )}

                {/* Activity & Comments */}
                <ActivityLog
                  activities={task.activities}
                  comments={task.comments}
                  onAddComment={(content) => {
                    const newComment = {
                      id: `cmt-${Date.now()}`,
                      user: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
                      content,
                      timestamp: "Just now",
                    };
                    setTask({
                      ...task,
                      comments: [...task.comments, newComment],
                    });
                  }}
                />
              </div>

              {/* Right Column - Metadata Sidebar */}
              <div className="w-full lg:w-[280px] xl:w-[300px] flex flex-col gap-5 flex-shrink-0">
                {/* Assignee */}
                <AssigneeSelector
                  value={task.assignees[0] || null}
                  options={mockAssignees}
                  onChange={(assignee) =>
                    setTask({ ...task, assignees: [assignee] })
                  }
                />

                {/* Reporter (read-only display) */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-500">Reporter / Reviewer</label>
                  {reporterAssignee ? (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                        {reporterAssignee.avatar ? (
                          <img src={reporterAssignee.avatar} alt={reporterAssignee.name} className="w-full h-full object-cover" />
                        ) : (
                          reporterAssignee.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium text-neutral-900">{reporterAssignee.name}</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-400">
                      No reviewer assigned
                    </div>
                  )}
                </div>

                {/* Status */}
                <StatusSelector
                  value={task.status}
                  task={task}
                  onChange={(status) => setTask({ ...task, status })}
                  disabled={isLockedForAssignee}
                />

                {/* Due Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-500">
                    Due Date
                  </label>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <CalendarSmallIcon />
                    <input
                      type="text"
                      value={task.dueDate}
                      disabled={isLockedForAssignee}
                      onChange={(e) =>
                        setTask({ ...task, dueDate: e.target.value })
                      }
                      className="flex-1 bg-transparent text-sm text-neutral-900 outline-none disabled:cursor-not-allowed"
                      placeholder="Select date"
                    />
                  </div>
                </div>

                {/* Priority */}
                <PrioritySelector
                  value={task.priority}
                  onChange={(priority) => setTask({ ...task, priority })}
                />

                {/* Effort Tracking */}
                <EffortFields
                  estimatedEffort={task.estimatedEffort}
                  actualEffort={task.actualEffort}
                  onEstimatedChange={(v) => setTask({ ...task, estimatedEffort: v })}
                  onActualChange={(v) => setTask({ ...task, actualEffort: v })}
                  disabled={isLockedForAssignee}
                />

                {/* Progress */}
                <ProgressBar
                  progress={task.progress}
                  onChange={(value) => setTask({ ...task, progress: value })}
                  disabled={isLockedForAssignee}
                />

                {/* Metadata */}
                <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Created</span>
                    <span className="text-sm text-neutral-500">
                      {task.createdAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Updated</span>
                    <span className="text-sm text-neutral-500">
                      {task.updatedAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Key</span>
                    <span className="text-sm text-neutral-500">{task.key}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions - Fixed at bottom */}
          <div className="flex items-center justify-end gap-3 px-6 lg:px-8 py-4 border-t border-neutral-200 bg-white">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {!isLockedForAssignee && (
              <Button variant="primary" onClick={handleSave}>
                Save Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
