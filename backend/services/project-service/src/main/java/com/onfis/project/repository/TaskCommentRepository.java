package com.onfis.project.repository;

import com.onfis.project.entity.TaskCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskCommentRepository extends JpaRepository<TaskCommentEntity, UUID> {

    List<TaskCommentEntity> findByTaskIdOrderByCreatedAtAsc(UUID taskId);
}
