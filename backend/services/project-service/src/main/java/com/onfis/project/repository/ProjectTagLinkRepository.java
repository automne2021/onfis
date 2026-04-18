package com.onfis.project.repository;

import com.onfis.project.entity.ProjectTagLinkEntity;
import com.onfis.project.entity.ProjectTagLinkId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjectTagLinkRepository extends JpaRepository<ProjectTagLinkEntity, ProjectTagLinkId> {

    void deleteByIdProjectId(UUID projectId);
}
