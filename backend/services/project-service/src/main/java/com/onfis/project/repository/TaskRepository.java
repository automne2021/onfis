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

    // Review queue queries: IN_REVIEW always shown; DONE/IN_PROGRESS only if task has reviews
    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR (t.status IN :statuses AND EXISTS (
                SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id
            ))
        )
    """)
    Page<TaskEntity> findReviewQueue(UUID tenantId, @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses, Pageable pageable);

    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR (t.status IN :statuses AND EXISTS (
                SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id
            ))
        )
    """)
    Page<TaskEntity> findReviewQueueByProject(UUID tenantId, UUID projectId, @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses, Pageable pageable);

    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId AND t.reporterId = :reporterId
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR (t.status IN :statuses AND EXISTS (
                SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id
            ))
        )
    """)
    Page<TaskEntity> findReviewQueueByReporter(UUID tenantId, UUID reporterId, @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses, Pageable pageable);

    @Query("""
        SELECT t FROM TaskEntity t
        WHERE t.tenantId = :tenantId AND t.projectId = :projectId AND t.reporterId = :reporterId
        AND (
            t.status = com.onfis.project.domain.TaskStatus.IN_REVIEW
            OR (t.status IN :statuses AND EXISTS (
                SELECT 1 FROM TaskReviewEntity r WHERE r.taskId = t.id
            ))
        )
    """)
    Page<TaskEntity> findReviewQueueByProjectAndReporter(UUID tenantId, UUID projectId, UUID reporterId, @org.springframework.data.repository.query.Param("statuses") Collection<TaskStatus> statuses, Pageable pageable);
}
