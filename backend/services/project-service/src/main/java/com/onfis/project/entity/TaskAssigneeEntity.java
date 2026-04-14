package com.onfis.project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "task_assignees", schema = "public")
public class TaskAssigneeEntity {

    @EmbeddedId
    private TaskAssigneeId id;

    @Column(name = "assigned_at")
    private Instant assignedAt;
}
