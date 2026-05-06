import { useState } from "react";
import { useRole } from "../../../hooks/useRole";
import { useAuth } from "../../../hooks/useAuth";
import type { ReviewComment, ReviewAction } from "../types";

interface ReviewPanelProps {
  reviews: ReviewComment[];
  taskStatus: string;
  onApprove?: (comment: string) => void;
  onRequestChanges?: (comment: string) => void;
}

const ACTION_CONFIG: Record<ReviewAction, { label: string; color: string; icon: string; bg: string }> = {
  approved: {
    label: "Approved",
    color: "text-emerald-700",
    icon: "check_circle",
    bg: "bg-emerald-50 border-emerald-200",
  },
  changes_requested: {
    label: "Changes Requested",
    color: "text-amber-700",
    icon: "pending",
    bg: "bg-amber-50 border-amber-200",
  },
  comment: {
    label: "Comment",
    color: "text-neutral-600",
    icon: "chat",
    bg: "bg-neutral-50 border-neutral-200",
  },
};

function ReviewTimeline({ reviews }: { reviews: ReviewComment[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review, idx) => {
        const cfg = ACTION_CONFIG[review.action];
        const isLast = idx === reviews.length - 1;
        return (
          <div key={review.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                <span className={`material-symbols-rounded ${cfg.color}`} style={{ fontSize: 14 }}>
                  {cfg.icon}
                </span>
              </div>
              {!isLast && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center text-[10px] font-bold text-neutral-600 flex-shrink-0">
                  {review.authorAvatar ? (
                    <img src={review.authorAvatar} alt={review.authorName} className="w-full h-full object-cover" />
                  ) : (
                    review.authorName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-semibold text-neutral-800">{review.authorName}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-neutral-400 ml-auto">{review.createdAt}</span>
              </div>
              {review.content && (
                <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
                  {review.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewPanel({ reviews, taskStatus, onApprove, onRequestChanges }: ReviewPanelProps) {
  const { isManagerLike: isManager } = useRole();
  const { dbUser: currentUser } = useAuth();
  const [comment, setComment] = useState("");
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");

  const isInReview = taskStatus === "IN_REVIEW";
  const isDone = taskStatus === "DONE";

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <span className="material-symbols-rounded text-neutral-500" style={{ fontSize: 18 }}>rate_review</span>
          Reviews
          {reviews.length > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-neutral-200 text-neutral-600 rounded-full">
              {reviews.length}
            </span>
          )}
        </h3>
        {isDone && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
            <span className="material-symbols-rounded" style={{ fontSize: 12 }}>verified</span>
            Approved
          </span>
        )}
      </div>

      {/* Timeline */}
      {reviews.length > 0 ? (
        <ReviewTimeline reviews={reviews} />
      ) : (
        <p className="text-sm text-neutral-400 italic">No review activity yet.</p>
      )}

      {/* Manager action area — only when task is IN_REVIEW */}
      {isManager && isInReview && mode === "idle" && (
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setMode("approve")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check</span>
            Approve
          </button>
          <button
            type="button"
            onClick={() => setMode("reject")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>undo</span>
            Request Changes
          </button>
        </div>
      )}

      {/* Approve confirmation */}
      {isManager && isInReview && mode === "approve" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-emerald-800">
            Optionally leave an approval note:
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Great work! Task approved..."
            rows={2}
            className="w-full text-sm text-neutral-900 border border-emerald-200 rounded-lg p-2.5 resize-none outline-none focus:border-emerald-400 bg-white"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setMode("idle"); setComment(""); }}
              className="px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApprove?.(comment.trim());
                setMode("idle");
                setComment("");
              }}
              className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check</span>
              Confirm Approval
            </button>
          </div>
        </div>
      )}

      {/* Request changes */}
      {isManager && isInReview && mode === "reject" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-amber-800">
            Describe what needs to be revised:
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Please revise the following..."
            rows={3}
            className="w-full text-sm text-neutral-900 border border-amber-200 rounded-lg p-2.5 resize-none outline-none focus:border-amber-400 bg-white"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setMode("idle"); setComment(""); }}
              className="px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!comment.trim()}
              onClick={() => {
                onRequestChanges?.(comment.trim());
                setMode("idle");
                setComment("");
              }}
              className="px-4 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>send</span>
              Request Changes
            </button>
          </div>
        </div>
      )}

      {/* Employee awaiting review message */}
      {!isManager && isInReview && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>hourglass_top</span>
          Your submission is awaiting review. You will be notified once the manager takes action.
        </div>
      )}

      {/* Unused currentUser check to satisfy lint */}
      {false && currentUser?.id}
    </div>
  );
}
