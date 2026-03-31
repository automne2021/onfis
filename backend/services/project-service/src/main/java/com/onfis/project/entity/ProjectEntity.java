package com.onfis.project.entity;

import com.onfis.project.domain.ProjectStatus;
import com.onfis.project.domain.TaskPriority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "projects", schema = "public")
public class ProjectEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug")
    private String slug;

    @Column(name = "description")
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "customer")
    private String customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ProjectStatus status = ProjectStatus.PLANNING;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "progress", nullable = false)
    private Integer progress = 0;

    @Column(name = "tags", columnDefinition = "jsonb")
    private String tags = "[]";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
