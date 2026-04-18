package com.onfis.project.dto;

import java.util.UUID;

public record TaskSubtaskResponse(
        UUID id,
        String title,
        boolean completed
) {
}
