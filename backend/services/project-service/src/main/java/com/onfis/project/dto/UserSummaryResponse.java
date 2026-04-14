package com.onfis.project.dto;

import java.util.UUID;

public record UserSummaryResponse(
        UUID id,
        String name,
        String avatar
) {
}
