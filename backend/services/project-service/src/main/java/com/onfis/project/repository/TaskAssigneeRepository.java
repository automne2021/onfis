package com.onfis.project.repository;

import com.onfis.project.entity.TaskAssigneeEntity;
import com.onfis.project.entity.TaskAssigneeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssigneeEntity, TaskAssigneeId> {

    List<TaskAssigneeEntity> findByIdTaskId(UUID taskId);

    void deleteByIdTaskId(UUID taskId);

    @Query("""
        select count(ta) from TaskAssigneeEntity ta
        where ta.id.userId = :userId and ta.id.taskId in (
            select t.id from TaskEntity t where t.projectId = :projectId
        )
    """)
    long countAssignedInProject(UUID projectId, UUID userId);
}
