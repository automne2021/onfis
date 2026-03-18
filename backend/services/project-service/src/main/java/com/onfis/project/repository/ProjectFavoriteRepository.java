package com.onfis.project.repository;

import com.onfis.project.entity.ProjectFavoriteEntity;
import com.onfis.project.entity.ProjectFavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjectFavoriteRepository extends JpaRepository<ProjectFavoriteEntity, ProjectFavoriteId> {

    boolean existsByIdProjectIdAndIdUserId(UUID projectId, UUID userId);

    void deleteByIdProjectIdAndIdUserId(UUID projectId, UUID userId);
}
