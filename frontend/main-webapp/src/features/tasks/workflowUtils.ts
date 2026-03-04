import type { Task, TaskStatus } from "./types";

/**
 * Valid status transitions for the Factual Workflow state machine.
 * 
 * Linear progression: TODO → IN_PROGRESS → IN_REVIEW → DONE
 * Side-state:         IN_PROGRESS ↔ BLOCKED
 * Rejection:          IN_REVIEW → TODO (with reason)
 *                     IN_REVIEW → IN_PROGRESS (with reason)
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    TODO: ["IN_PROGRESS"],
    IN_PROGRESS: ["IN_REVIEW", "BLOCKED"],
    BLOCKED: ["IN_PROGRESS", "TODO"],
    IN_REVIEW: ["DONE", "IN_PROGRESS", "TODO"],
    DONE: [],
};

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
 */
export function getTransitionError(
    from: TaskStatus,
    to: TaskStatus,
    task: Pick<Task, "assignees" | "reporterId">
): string | null {
    if (from === to) return null;

    // Check linear progression rule
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
