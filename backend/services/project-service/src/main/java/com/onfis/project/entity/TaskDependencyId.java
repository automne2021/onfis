package com.onfis.project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TaskDependencyId implements Serializable {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "blocked_by_task_id", nullable = false)
    private UUID blockedByTaskId;
}
