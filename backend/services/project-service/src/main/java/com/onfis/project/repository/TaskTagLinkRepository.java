package com.onfis.project.repository;

import com.onfis.project.entity.TaskTagLinkEntity;
import com.onfis.project.entity.TaskTagLinkId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TaskTagLinkRepository extends JpaRepository<TaskTagLinkEntity, TaskTagLinkId> {

    void deleteByIdTaskId(UUID taskId);
}
