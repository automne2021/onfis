package com.onfis.project.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ProjectUpsertRequest(
        @NotBlank String title,
        String description,
        @NotNull String status,
        @NotNull String priority,
        @Min(0) @Max(100) Integer progress,
        LocalDate startDate,
        LocalDate dueDate,
        String tags
) {
}
