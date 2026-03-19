package com.onfis.project.repository;

import com.onfis.project.domain.TaskStatus;
import com.onfis.project.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    List<TaskEntity> findByTenantIdAndProjectIdOrderByCreatedAtDesc(UUID tenantId, UUID projectId);

    Optional<TaskEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    List<TaskEntity> findByTenantIdAndStatusOrderByUpdatedAtDesc(UUID tenantId, TaskStatus status);

    List<TaskEntity> findByTenantIdAndStatusAndReporterIdOrderByUpdatedAtDesc(UUID tenantId, TaskStatus status, UUID reporterId);

        @Query("""
                select distinct t from TaskEntity t
                where t.tenantId = :tenantId
                    and t.id in (
                        select ta.id.taskId from TaskAssigneeEntity ta where ta.id.userId = :userId
                    )
                order by t.updatedAt desc
        """)
        List<TaskEntity> findAssignedToUser(UUID tenantId, UUID userId);

        long countByProjectIdAndStageId(UUID projectId, UUID stageId);
}
