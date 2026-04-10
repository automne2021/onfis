package com.onfis.project.repository;

import com.onfis.project.entity.ProjectMemberRoleEntity;
import com.onfis.project.entity.ProjectMemberRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProjectMemberRoleRepository extends JpaRepository<ProjectMemberRoleEntity, ProjectMemberRoleId> {

    @Query("SELECT r FROM ProjectMemberRoleEntity r WHERE r.id.projectId = :projectId AND r.id.userId = :userId")
    List<ProjectMemberRoleEntity> findByProjectIdAndUserId(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    @Query("SELECT r FROM ProjectMemberRoleEntity r WHERE r.id.projectId = :projectId")
    List<ProjectMemberRoleEntity> findByProjectId(@Param("projectId") UUID projectId);

    void deleteByIdProjectIdAndIdUserId(UUID projectId, UUID userId);
}
