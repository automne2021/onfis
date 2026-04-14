package com.onfis.project.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkflowStageUpsertRequest(
        @NotBlank String name
) {
}
