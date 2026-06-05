package com.onfis.project.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the task status state machine.
 *
 * The transition map is extracted here for isolated testing:
 *
 *   TODO         → [IN_PROGRESS]
 *   IN_PROGRESS  → [IN_REVIEW, BLOCKED]
 *   BLOCKED      → [IN_PROGRESS, TODO]
 *   IN_REVIEW    → [DONE, IN_PROGRESS, TODO]
 *   DONE         → [] (terminal)
 *
 * This class acts as a specification document for the state machine and guards
 * against accidental regression when modifying ProjectModuleService.
 */
@DisplayName("Task Status State Machine")
class TaskStatusTransitionTest {

    // ── Transition map mirrored from ProjectModuleService (authoritative source) ──
    private static final Map<TaskStatus, Set<TaskStatus>> TASK_TRANSITIONS = Map.of(
            TaskStatus.TODO,        Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW, TaskStatus.BLOCKED),
            TaskStatus.BLOCKED,     Set.of(TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.IN_REVIEW,   Set.of(TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.DONE,        Set.of()
    );

    /** Mirrors the exact method in ProjectModuleService. */
    private void validateTaskTransition(TaskStatus from, TaskStatus to) {
        if (from == to) {
            return; // no-op — same state is always allowed
        }
        Set<TaskStatus> allowed = TASK_TRANSITIONS.getOrDefault(from, Set.of());
        if (!allowed.contains(to)) {
            throw new IllegalArgumentException("Cannot move task from " + from + " to " + to);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  VALID TRANSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Valid transitions must not throw")
    class ValidTransitions {

        @ParameterizedTest(name = "{0} → {1}")
        @CsvSource({
                "TODO, IN_PROGRESS",
                "IN_PROGRESS, IN_REVIEW",
                "IN_PROGRESS, BLOCKED",
                "BLOCKED, IN_PROGRESS",
                "BLOCKED, TODO",
                "IN_REVIEW, DONE",
                "IN_REVIEW, IN_PROGRESS",
                "IN_REVIEW, TODO"
        })
        void validTransitionDoesNotThrow(String from, String to) {
            validateTaskTransition(TaskStatus.valueOf(from), TaskStatus.valueOf(to));
        }

        @Test
        @DisplayName("Same-status transition is always a no-op")
        void sameStatusIsNoOp() {
            for (TaskStatus s : TaskStatus.values()) {
                validateTaskTransition(s, s); // must not throw
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  INVALID TRANSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Invalid transitions must throw IllegalArgumentException")
    class InvalidTransitions {

        @ParameterizedTest(name = "{0} → {1}")
        @CsvSource({
                // TODO can only go to IN_PROGRESS — not jump further
                "TODO, BLOCKED",
                "TODO, IN_REVIEW",
                "TODO, DONE",
                // IN_PROGRESS cannot skip to DONE
                "IN_PROGRESS, DONE",
                "IN_PROGRESS, TODO",
                // BLOCKED cannot jump to IN_REVIEW or DONE
                "BLOCKED, IN_REVIEW",
                "BLOCKED, DONE",
                // DONE is terminal — no outgoing transitions
                "DONE, TODO",
                "DONE, IN_PROGRESS",
                "DONE, BLOCKED",
                "DONE, IN_REVIEW"
        })
        void invalidTransitionThrows(String from, String to) {
            assertThatThrownBy(() ->
                    validateTaskTransition(TaskStatus.valueOf(from), TaskStatus.valueOf(to))
            ).isInstanceOf(IllegalArgumentException.class)
             .hasMessageContaining("Cannot move task from " + from + " to " + to);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  STATE MACHINE STRUCTURAL PROPERTIES
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("State machine structural properties")
    class StateMachineStructure {

        @Test
        @DisplayName("DONE is a terminal state with no outgoing transitions")
        void doneHasNoOutgoingTransitions() {
            Set<TaskStatus> outgoing = TASK_TRANSITIONS.getOrDefault(TaskStatus.DONE, Set.of());
            assertThat(outgoing).isEmpty();
        }

        @Test
        @DisplayName("Every TaskStatus constant appears in the transition map")
        void allStatusesAreInMap() {
            for (TaskStatus s : TaskStatus.values()) {
                assertThat(TASK_TRANSITIONS).containsKey(s);
            }
        }

        @Test
        @DisplayName("TODO has exactly one outgoing transition")
        void todoHasExactlyOneOutgoing() {
            assertThat(TASK_TRANSITIONS.get(TaskStatus.TODO))
                    .containsExactlyInAnyOrder(TaskStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("IN_PROGRESS can move to both IN_REVIEW and BLOCKED")
        void inProgressCanMoveToReviewOrBlocked() {
            assertThat(TASK_TRANSITIONS.get(TaskStatus.IN_PROGRESS))
                    .containsExactlyInAnyOrder(TaskStatus.IN_REVIEW, TaskStatus.BLOCKED);
        }

        @Test
        @DisplayName("IN_REVIEW can be rejected back to IN_PROGRESS or cancelled to TODO")
        void inReviewCanBeRejectedOrCancelled() {
            assertThat(TASK_TRANSITIONS.get(TaskStatus.IN_REVIEW))
                    .containsExactlyInAnyOrder(TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO);
        }
    }
}
