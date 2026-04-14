package com.onfis.project.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TaskStageUpdateRequest(
        @NotNull UUID stageId,
        @NotBlank String status,
        @Min(0) @Max(100) Integer progress
) {
}
