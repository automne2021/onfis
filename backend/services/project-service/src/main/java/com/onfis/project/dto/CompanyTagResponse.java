package com.onfis.project.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CompanyTagResponse(
        UUID id,
        String name,
        String color,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
