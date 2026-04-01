package com.onfis.project.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        UUID projectId,
        UUID stageId,
        UUID milestoneId,
        String projectTitle,
        String projectSlug,
        String title,
        String description,
        String priority,
        String status,
        int progress,
        LocalDate startDate,
        LocalDate dueDate,
        List<UserSummaryResponse> assignees,
        String tags,
        UUID reporterId,
        String reporterName,
        BigDecimal estimatedEffort,
        BigDecimal actualEffort,
        List<UUID> blockedBy,
        List<TaskReviewResponse> reviews,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        String key,
        boolean canEdit,
        boolean canReview
) {
}
