package com.onfis.project.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectMemberResponse(
        UUID id,
        String name,
        String avatar,
        String projectRole,
        OffsetDateTime joinedAt,
        long taskCount
) {
}
