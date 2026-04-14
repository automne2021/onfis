package com.onfis.project.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String slug,
        String title,
        String description,
        UUID managerId,
        String customer,
        String status,
        String priority,
        int progress,
        LocalDate dueDate,
        String tags,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<UserSummaryResponse> assignees,
        boolean canManage
) {
}
