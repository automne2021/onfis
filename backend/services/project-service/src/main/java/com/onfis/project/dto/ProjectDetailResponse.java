package com.onfis.project.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProjectDetailResponse(
        UUID id,
        String slug,
        String title,
        String description,
        UUID managerId,
        String managerName,
        String managerAvatar,
        String customer,
        String status,
        String priority,
        int progress,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate dueDate,
        String tags,
        OffsetDateTime createdAt,
        List<UserSummaryResponse> members,
        boolean canManage,
        boolean isStarred,
        List<MilestoneResponse> milestones,
        List<TaskResponse> recentTasks,
        int memberCount,
        int daysRemaining
) {
}
