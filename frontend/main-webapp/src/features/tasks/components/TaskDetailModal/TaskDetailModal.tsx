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
  CalendarSmallIcon,
} from "../../../../components/common/Icons";
import Button from "../../../../components/common/Button";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/useToast";
import { useRole } from "../../../../hooks/useRole";
import { RichTextEditor } from "../../../../components/common";
import ReviewPanel from "../ReviewPanel";
import type { ReviewComment } from "../../types";
import { addTaskComment } from "../../../../services/taskService";

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
  const [taskReviews, setTaskReviews] = useState<ReviewComment[]>(initialTask.reviews ?? []);
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { isManager, isEmployee } = useRole();

  // Determine role-based permissions
  const isAssignee = task.assignees.some((a) => a.id === currentUser.id);
  const isReporter = task.reporterId === currentUser.id;
  const isInReview = task.status === "IN_REVIEW";
  const canReview = isInReview && (isReporter || isManager);
  const isLockedForAssignee = isInReview && isAssignee && !isReporter && !isManager;

  // Get last rejection feedback
  const lastRejection = [...task.comments].reverse().find((c) => c.content.startsWith("[REJECTION]"));
  const lastRejectionReason = lastRejection?.content.replace("[REJECTION] ", "") ?? null;

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
    const newReview: ReviewComment = {
      id: `rc-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      action: "approved",
      content: "",
      createdAt: "Just now",
    };
    const updated = { ...task, status: "DONE" as const, reviews: [...taskReviews, newReview] };
    setTaskReviews((prev) => [...prev, newReview]);
    onSave(updated);
    showToast("Task approved and marked as DONE.", "success");
    onClose();
  }, [task, taskReviews, currentUser, onSave, onClose, showToast]);

  const handleReject = useCallback(
    (reason: string) => {
      const newReview: ReviewComment = {
        id: `rc-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        action: "changes_requested",
        content: reason,
        createdAt: "Just now",
      };
      const updated = {
        ...task,
        status: "IN_PROGRESS" as const,
        reviews: [...taskReviews, newReview],
      };
      setTaskReviews((prev) => [...prev, newReview]);
      onSave(updated);
      showToast("Changes requested — task returned to In Progress.", "warning");
      onClose();
    },
    [task, taskReviews, currentUser, onSave, onClose, showToast]
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

          {/* Rejection Feedback Banner */}
          {isEmployee && !!lastRejectionReason && task.status !== "IN_REVIEW" && (
            <div className="px-6 lg:px-8 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
              <span className="material-symbols-rounded text-amber-600 mt-0.5" style={{ fontSize: 18 }}>undo</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Changes requested by reviewer</p>
                <p className="text-sm text-amber-700 mt-0.5">{lastRejectionReason}</p>
              </div>
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
                  <label className="body-3-medium text-neutral-900">
                    Description
                  </label>
                  <RichTextEditor
                    onChange={(content) =>
                      setTask({ ...task, description: content })
                    }
                  />
                </div>

                {/* Sub-tasks Section */}
                <SubTaskList
                  taskId={task.id}
                  subTasks={task.subTasks}
                  onChange={(subTasks) => setTask({ ...task, subTasks })}
                />

                {/* Employee: Submit for Review */}
                {isEmployee && isAssignee && task.status === "IN_PROGRESS" && (
                  <div className="flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-medium text-blue-800">
                      Ready to submit? Your manager will review and approve this task.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTask({ ...task, status: "IN_REVIEW" as const });
                        showToast("Task submitted for review.", "info");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors w-fit"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>upload</span>
                      Submit for Review
                    </button>
                  </div>
                )}

                {/* Reviewer Approve/Reject Controls */}
                {canReview && (
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
                          ✕ Request Changes
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

                {/* Review History */}
                {(taskReviews.length > 0 || isInReview) && (
                  <ReviewPanel
                    reviews={taskReviews}
                    taskStatus={task.status}
                    onApprove={canReview ? handleApprove : undefined}
                    onRequestChanges={canReview ? handleReject : undefined}
                  />
                )}

                {/* Activity & Comments */}
                <ActivityLog
                  activities={task.activities}
                  comments={task.comments}
                  onAddComment={(content) => {
                    const run = async () => {
                      try {
                        const saved = await addTaskComment(task.id, content);
                        const newComment = {
                          id: saved.id,
                          user: { id: saved.authorId, name: saved.authorName, avatar: saved.authorAvatar },
                          content: saved.content,
                          timestamp: saved.createdAt,
                        };
                        setTask((prev) => ({
                          ...prev,
                          comments: [...prev.comments, newComment],
                        }));
                      } catch {
                        showToast("Unable to add comment", "error");
                      }
                    };
                    void run();
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
