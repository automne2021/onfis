package com.onfis.project.repository;

import com.onfis.project.domain.TaskStatus;
import com.onfis.project.entity.TaskEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    List<TaskEntity> findByTenantIdAndProjectIdOrderByCreatedAtDesc(UUID tenantId, UUID projectId);

    Optional<TaskEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndProjectIdAndTaskKey(UUID tenantId, UUID projectId, String taskKey);

    List<TaskEntity> findByTenantIdAndStatusOrderByUpdatedAtDesc(UUID tenantId, TaskStatus status);

    List<TaskEntity> findByTenantIdAndStatusAndReporterIdOrderByUpdatedAtDesc(UUID tenantId, TaskStatus status, UUID reporterId);

        Page<TaskEntity> findByTenantIdAndStatusIn(UUID tenantId, Collection<TaskStatus> statuses, Pageable pageable);

        Page<TaskEntity> findByTenantIdAndProjectIdAndStatusIn(
            UUID tenantId,
            UUID projectId,
            Collection<TaskStatus> statuses,
            Pageable pageable
        );

        Page<TaskEntity> findByTenantIdAndReporterIdAndStatusIn(
            UUID tenantId,
            UUID reporterId,
            Collection<TaskStatus> statuses,
            Pageable pageable
        );

        Page<TaskEntity> findByTenantIdAndProjectIdAndReporterIdAndStatusIn(
            UUID tenantId,
            UUID projectId,
            UUID reporterId,
            Collection<TaskStatus> statuses,
            Pageable pageable
        );

    @Query("""
            select distinct t from TaskEntity t
            where t.tenantId = :tenantId
                and t.id in (
                    select ta.id.taskId from TaskAssigneeEntity ta where ta.id.userId = :userId
                )
            order by t.updatedAt desc
    """)
    List<TaskEntity> findAssignedToUser(UUID tenantId, UUID userId);

    @Query("""
            select distinct t from TaskEntity t
            left join TaskAssigneeEntity ta on ta.id.taskId = t.id
            where t.tenantId = :tenantId
                and (ta.id.userId = :userId or t.reporterId = :userId)
            order by t.updatedAt desc
    """)
    List<TaskEntity> findAssignedOrReportedToUser(UUID tenantId, UUID userId);

    List<TaskEntity> findByTenantIdAndMilestoneId(UUID tenantId, UUID milestoneId);

    long countByProjectIdAndStageId(UUID projectId, UUID stageId);

    List<TaskEntity> findByTenantIdAndParentTaskId(UUID tenantId, UUID parentTaskId);

    // ── Review queue: default (all tabs / approved) ──────────────────────────────
    // IN_REVIEW always shown; DONE/IN_PROGRESS only if task has at least one review.
    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId
        AND t.status IN :statuses
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id)
        )
    """)
    Page<TaskEntity> findReviewQueue(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND t.status IN :statuses
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id)
        )
    """)
    Page<TaskEntity> findReviewQueueByProject(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM TaskEntity t
        JOIN TaskAssigneeEntity ta ON ta.id.taskId = t.id
        WHERE t.tenantId = :tenantId
        AND ta.id.userId = :userId
        AND t.status IN :statuses
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id)
        )
    """)
    Page<TaskEntity> findReviewQueueByAssignee(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM TaskEntity t
        JOIN TaskAssigneeEntity ta ON ta.id.taskId = t.id
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND ta.id.userId = :userId
        AND t.status IN :statuses
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id)
        )
    """)
    Page<TaskEntity> findReviewQueueByProjectAndAssignee(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    // ── Review queue: tasks WITH CHANGES_REQUESTED history ──────────────────────
    // Used for manager "Changes Requested" and employee "Rework Needed" tabs.
    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId
        AND t.status IN :statuses
        AND EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findReviewQueueWithChangesHistory(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND t.status IN :statuses
        AND EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findReviewQueueByProjectWithChangesHistory(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM TaskEntity t
        JOIN TaskAssigneeEntity ta ON ta.id.taskId = t.id
        WHERE t.tenantId = :tenantId
        AND ta.id.userId = :userId
        AND t.status IN :statuses
        AND EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findReviewQueueByAssigneeWithChangesHistory(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM TaskEntity t
        JOIN TaskAssigneeEntity ta ON ta.id.taskId = t.id
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND ta.id.userId = :userId
        AND t.status IN :statuses
        AND EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findReviewQueueByProjectAndAssigneeWithChangesHistory(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses,
            Pageable pageable);

    // ── Review queue: IN_REVIEW tasks with NO CHANGES_REQUESTED history ──────────
    // Used for employee "Under Review" tab (fresh submissions, never rejected).
    @Query("""
        SELECT DISTINCT t FROM TaskEntity t
        JOIN TaskAssigneeEntity ta ON ta.id.taskId = t.id
        WHERE t.tenantId = :tenantId
        AND ta.id.userId = :userId
        AND t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
        AND NOT EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findUnderReviewByAssignee(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM TaskEntity t
        JOIN TaskAssigneeEntity ta ON ta.id.taskId = t.id
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND ta.id.userId = :userId
        AND t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
        AND NOT EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findUnderReviewByProjectAndAssignee(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            Pageable pageable);

    // ── Review queue: manager pending (IN_REVIEW + no CHANGES_REQUESTED history) ─
    // Used for manager "Pending Review" tab (fresh submissions awaiting first decision).
    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId
        AND t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
        AND NOT EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findPendingReviewQueue(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            Pageable pageable);

    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
        AND NOT EXISTS (SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id AND r.action = 'CHANGES_REQUESTED')
    """)
    Page<TaskEntity> findPendingReviewQueueByProject(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            Pageable pageable);
}
