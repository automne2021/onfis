package com.onfis.admin.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TicketCommentResponse(
        UUID id,
        UUID authorId,
        String authorName,
        String authorAvatar,
        String content,
        OffsetDateTime createdAt,
        boolean isInternal) {
}
