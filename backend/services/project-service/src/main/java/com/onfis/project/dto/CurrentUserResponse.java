package com.onfis.project.dto;

import java.util.Set;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String name,
        String role,
        Set<String> permissions
) {
}
