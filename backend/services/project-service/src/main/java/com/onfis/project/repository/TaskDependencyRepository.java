package com.onfis.project.repository;

import com.onfis.project.entity.TaskDependencyEntity;
import com.onfis.project.entity.TaskDependencyId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskDependencyRepository extends JpaRepository<TaskDependencyEntity, TaskDependencyId> {

    List<TaskDependencyEntity> findByIdTaskId(UUID taskId);
}
