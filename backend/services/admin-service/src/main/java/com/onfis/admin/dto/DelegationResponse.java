package com.onfis.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DelegationResponse(
        UUID id,
        UUID tenantId,
        UUID createdBy,
        UUID assignedTo,
        String title,
        String description,
        String priority,
        String status,
        String targetRole,
        Map<String, Object> metadata,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<Assignee> assignees) {

    public record Assignee(
            UUID id,
            String firstName,
            String lastName,
            String email,
            String role,
            String avatarUrl) {
    }
}
