package com.onfis.project.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewCreateRequest(
        @NotBlank String action,
        String content
) {
}
