package com.onfis.project.repository;

import com.onfis.project.entity.WorkflowStageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowStageRepository extends JpaRepository<WorkflowStageEntity, UUID> {

    List<WorkflowStageEntity> findByProjectIdOrderByStageOrderAsc(UUID projectId);

    boolean existsByProjectId(UUID projectId);
}
