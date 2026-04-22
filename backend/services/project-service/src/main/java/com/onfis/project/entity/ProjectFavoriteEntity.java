package com.onfis.project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "project_favorites", schema = "public")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class ProjectFavoriteEntity {

    @EmbeddedId
    private ProjectFavoriteId id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
