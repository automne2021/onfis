package com.onfis.project.repository;

import com.onfis.project.entity.TaskReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskReviewRepository extends JpaRepository<TaskReviewEntity, UUID> {

    List<TaskReviewEntity> findByTenantIdAndTaskIdOrderByCreatedAtAsc(UUID tenantId, UUID taskId);
}
