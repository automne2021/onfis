package com.onfis.project.repository;

import com.onfis.project.entity.TaskActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskActivityRepository extends JpaRepository<TaskActivityEntity, UUID> {

    List<TaskActivityEntity> findByTaskIdOrderByCreatedAtAsc(UUID taskId);

    void deleteByTaskId(UUID taskId);
}
