package com.onfis.project.repository;

import com.onfis.project.entity.TaskSubtaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskSubtaskRepository extends JpaRepository<TaskSubtaskEntity, UUID> {

    List<TaskSubtaskEntity> findByTaskIdOrderByCreatedAtAsc(UUID taskId);

    Optional<TaskSubtaskEntity> findByIdAndTaskId(UUID id, UUID taskId);
}
