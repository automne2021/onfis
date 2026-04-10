package com.onfis.project.repository;

import com.onfis.project.entity.ProjectCustomRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectCustomRoleRepository extends JpaRepository<ProjectCustomRoleEntity, UUID> {

    List<ProjectCustomRoleEntity> findByProjectIdOrderByCreatedAtAsc(UUID projectId);

    Optional<ProjectCustomRoleEntity> findByIdAndProjectId(UUID id, UUID projectId);

    boolean existsByProjectIdAndNameIgnoreCase(UUID projectId, String name);
}
