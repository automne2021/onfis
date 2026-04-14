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
@Table(name = "project_members", schema = "public")
public class ProjectMemberEntity {

    @EmbeddedId
    private ProjectMemberId id;

    @Column(name = "role", nullable = false)
    private String role = "MEMBER";

    @Column(name = "joined_at")
    private Instant joinedAt;
}
