package com.onfis.project.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TaskDependencyRequest(
        @NotNull UUID blockedByTaskId
) {
}
