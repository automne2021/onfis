package com.onfis.position.dto;

import java.util.UUID;

public record PositionUpsertRequest(
        String title,
        String description,
        UUID departmentId,
        UUID parentId
) {}
