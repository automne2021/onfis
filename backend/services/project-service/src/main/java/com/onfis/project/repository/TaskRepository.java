package com.onfis.project.repository;

import com.onfis.project.domain.TaskStatus;
import com.onfis.project.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    List<TaskEntity> findByTenantIdAndProjectIdOrderByCreatedAtDesc(UUID tenantId, UUID projectId);

    Optional<TaskEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    List<TaskEntity> findByTenantIdAndStatusOrderByUpdatedAtDesc(UUID tenantId, TaskStatus status);

    List<TaskEntity> findByTenantIdAndStatusAndReporterIdOrderByUpdatedAtDesc(UUID tenantId, TaskStatus status, UUID reporterId);
}
