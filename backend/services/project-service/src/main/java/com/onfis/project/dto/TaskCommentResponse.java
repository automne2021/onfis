package com.onfis.project.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskCommentResponse(
        UUID id,
        UUID authorId,
        String authorName,
        String authorAvatar,
        String content,
        OffsetDateTime createdAt
) {
}
