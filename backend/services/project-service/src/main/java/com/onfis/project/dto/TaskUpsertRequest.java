package com.onfis.project.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskUpsertRequest(
        @NotBlank String title,
        String description,
        @NotBlank String status,
        @NotBlank String priority,
        @Min(0) @Max(100) Integer progress,
        LocalDate dueDate,
        UUID reporterId,
        BigDecimal estimatedEffort,
        BigDecimal actualEffort,
        UUID parentTaskId,
        UUID stageId,
        UUID milestoneId,
        String tags,
        @NotNull List<UUID> assigneeIds,
        String blockedReason
) {
}
