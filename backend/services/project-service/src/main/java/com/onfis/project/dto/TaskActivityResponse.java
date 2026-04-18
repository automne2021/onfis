package com.onfis.project.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskActivityResponse(
        UUID id,
        UUID actorId,
        String actorName,
        String action,
        String value,
        String description,
        OffsetDateTime createdAt
) {
}
