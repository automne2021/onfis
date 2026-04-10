package com.onfis.position.dto;

import java.util.List;

public record PositionTreeResponse(
        String id,
        String name,
        String title,
        String avatar,
        boolean isVacant,
        String status,
        Integer subordinateCount,
        List<PositionTreeResponse> children
) {}
