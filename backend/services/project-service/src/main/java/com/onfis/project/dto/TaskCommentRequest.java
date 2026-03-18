package com.onfis.project.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskCommentRequest(
        @NotBlank String content
) {
}
