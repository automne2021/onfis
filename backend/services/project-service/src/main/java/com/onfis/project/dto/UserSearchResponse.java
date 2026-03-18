package com.onfis.project.dto;

import java.util.UUID;

public record UserSearchResponse(
        UUID id,
        String name,
        String avatar
) {
}
