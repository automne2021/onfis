package com.onfis.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProjectMemberRequest(
        @NotNull UUID userId,
        @NotBlank String role
) {
}
