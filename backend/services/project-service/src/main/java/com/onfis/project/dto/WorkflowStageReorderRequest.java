package com.onfis.project.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record WorkflowStageReorderRequest(
        @NotNull List<UUID> orderedStageIds
) {
}
