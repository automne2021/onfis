package com.onfis.project.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "attachments", schema = "public")
public class AttachmentEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "announcement_id")
    private UUID announcementId;

    @Column(name = "message_id")
    private UUID messageId;

    /** TASK_REFERENCE | TASK_SUBMISSION | PROJECT_FILE | ANNOUNCEMENT */
    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "name")
    private String name;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "size")
    private Integer size;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
