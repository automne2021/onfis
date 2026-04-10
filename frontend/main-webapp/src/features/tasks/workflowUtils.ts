import type { Task, TaskStatus } from "./types";

/**
 * Valid status transitions for the Factual Workflow state machine.
 * 
 * Linear progression: TODO → IN_PROGRESS → IN_REVIEW → DONE
 * Side-state:         IN_PROGRESS ↔ BLOCKED
 * Rejection:          IN_REVIEW → TODO (with reason)
 *                     IN_REVIEW → IN_PROGRESS (with reason)
 *
 * Note: Employees cannot directly set IN_REVIEW; they must use "Submit for Review".
 *       IN_REVIEW is set only by the submit flow (checks progress=100 & actualEffort>0).
 *       BLOCKED always requires a reason.
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    TODO: ["IN_PROGRESS"],
    IN_PROGRESS: ["BLOCKED"],
    BLOCKED: ["IN_PROGRESS", "TODO"],
    IN_REVIEW: ["DONE", "IN_PROGRESS", "TODO"],
    DONE: [],
};

/** Transitions available only to managers / reporters (reviewers). */
export const MANAGER_ONLY_TRANSITIONS: TaskStatus[] = ["IN_REVIEW"];

/**
 * Check if a status transition is valid per the state machine.
 */
export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    if (from === to) return true; // No change is always valid
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get a human-readable error message explaining why a transition is blocked.
 * Returns null if the transition is valid.
 *
 * @param isEmployee - true when the current user's global role is EMPLOYEE
 * @param blockedReason - required when transitioning to BLOCKED
 */
export function getTransitionError(
    from: TaskStatus,
    to: TaskStatus,
    task: Pick<Task, "assignees" | "reporterId" | "progress" | "actualEffort">,
    isEmployee?: boolean,
    blockedReason?: string,
): string | null {
    if (from === to) return null;

    // Employees cannot directly set IN_REVIEW — they must use "Submit for Review"
    if (to === "IN_REVIEW" && isEmployee) {
        return "Use the 'Submit for Review' button to move this task to review.";
    }

    // Check linear progression rule (after employee check so the message is better)
    if (!isValidTransition(from, to)) {
        const allowed = ALLOWED_TRANSITIONS[from];
        if (allowed.length === 0) {
            return `This task is already marked as ${from}. No further transitions are available.`;
        }
        return `Cannot move from ${from} to ${to}. Allowed transitions: ${allowed.join(", ")}.`;
    }

    // Pre-requisite checks for specific transitions
    if (to === "IN_PROGRESS" && (!task.assignees || task.assignees.length === 0)) {
        return "Cannot start a task without an assigned team member. Please assign someone first.";
    }

    if (to === "IN_REVIEW" && !task.reporterId) {
        return "Cannot submit for review without a Reporter/Reviewer. Please assign a reviewer first.";
    }

    if (to === "BLOCKED" && !blockedReason?.trim()) {
        return "Please provide a reason for blocking this task.";
    }

    return null;
}

/**
 * Validate pre-conditions for "Submit for Review" (employee flow).
 * Returns an error string or null when valid.
 */
export function getSubmitForReviewError(
    task: Pick<Task, "assignees" | "reporterId" | "progress" | "actualEffort">,
): string | null {
    if (!task.reporterId) {
        return "Cannot submit for review without a Reporter/Reviewer. Please assign a reviewer first.";
    }
    if ((task.progress ?? 0) < 100) {
        return "Progress must be 100% before submitting for review.";
    }
    if (!task.actualEffort || task.actualEffort <= 0) {
        return "Please enter actual effort spent before submitting for review.";
    }
    return null;
}

/**
 * Check if a task can move to IN_PROGRESS (requires an assignee).
 */
export function canMoveToInProgress(task: Pick<Task, "assignees">): boolean {
    return task.assignees.length > 0;
}

/**
 * Status display configuration for UI rendering.
 */
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
    TODO: { label: "To Do", color: "bg-neutral-400" },
    IN_PROGRESS: { label: "In Progress", color: "bg-blue-500" },
    BLOCKED: { label: "Blocked", color: "bg-red-500" },
    IN_REVIEW: { label: "In Review", color: "bg-amber-500" },
    DONE: { label: "Done", color: "bg-green-500" },
};
