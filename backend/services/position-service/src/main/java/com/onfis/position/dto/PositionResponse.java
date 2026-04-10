package com.onfis.position.dto;

import java.time.Instant;
import java.util.UUID;

public record PositionResponse(
        UUID id,
        String title,
        String description,
        UUID departmentId,
        String departmentName,
        UUID parentId,
        UUID assignedUserId,
        String assignedUserName,
        boolean isVacant,
        Instant createdAt
) {}
