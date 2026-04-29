package com.onfis.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        String code,
        String title,
        String description,
        UUID requesterId,
        String requesterName,
        String category,
        String priority,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime resolvedAt,
        UUID assigneeId,
        String assigneeName,
        List<TicketCommentResponse> comments,
        Map<String, Object> payload) {
}
