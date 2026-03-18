package com.onfis.project.repository;

import com.onfis.project.entity.ProjectMilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestoneEntity, UUID> {

    List<ProjectMilestoneEntity> findByProjectIdOrderBySortOrderAsc(UUID projectId);
}
