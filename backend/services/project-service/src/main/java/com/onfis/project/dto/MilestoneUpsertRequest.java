package com.onfis.project.dto;

import java.time.LocalDate;

public record MilestoneUpsertRequest(
        String title,
        LocalDate targetDate,
        String status,
        Integer sortOrder
) {
}
