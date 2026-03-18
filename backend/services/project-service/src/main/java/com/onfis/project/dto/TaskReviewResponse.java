package com.onfis.project.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskReviewResponse(
        UUID id,
        UUID authorId,
        String authorName,
        String authorAvatar,
        String action,
        String content,
        OffsetDateTime createdAt
) {
}
