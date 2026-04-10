package com.onfis.project.repository;

import com.onfis.project.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {

    List<ProjectEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Optional<ProjectEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<ProjectEntity> findByTenantIdAndSlug(UUID tenantId, String slug);

    @Query("""
        select p from ProjectEntity p
        where p.tenantId = :tenantId and exists (
            select pm from ProjectMemberEntity pm
            where pm.id.projectId = p.id and pm.id.userId = :userId
        )
        order by p.createdAt desc
    """)
    List<ProjectEntity> findVisibleByUser(UUID tenantId, UUID userId);
}
