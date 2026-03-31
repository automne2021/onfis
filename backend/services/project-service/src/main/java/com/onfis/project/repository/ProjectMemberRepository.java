package com.onfis.project.repository;

import com.onfis.project.entity.ProjectMemberEntity;
import com.onfis.project.entity.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMemberEntity, ProjectMemberId> {

    List<ProjectMemberEntity> findByIdProjectId(UUID projectId);

    List<ProjectMemberEntity> findByIdProjectIdIn(List<UUID> projectIds);

    Optional<ProjectMemberEntity> findByIdProjectIdAndIdUserId(UUID projectId, UUID userId);

    boolean existsByIdProjectIdAndIdUserId(UUID projectId, UUID userId);
}
