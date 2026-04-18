package com.onfis.project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class TaskTagLinkId implements Serializable {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "tag_id", nullable = false)
    private UUID tagId;
}
