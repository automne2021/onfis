package com.onfis.project.dto;

import java.time.LocalDate;

public record MilestoneResponse(
        String id,
        String title,
        LocalDate targetDate,
        String status,
        int progress,
        int suggestedProgress,
        boolean progressOverridden
) {
}
