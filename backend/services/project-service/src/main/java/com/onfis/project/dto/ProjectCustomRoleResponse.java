package com.onfis.project.dto;

import java.util.UUID;

public record ProjectCustomRoleResponse(
        UUID id,
        String name,
        String color,
        UUID projectId
) {
}
