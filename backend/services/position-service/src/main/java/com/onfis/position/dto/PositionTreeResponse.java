package com.onfis.position.dto;

import java.util.List;

public record PositionTreeResponse(
        String id,
        String positionId,
        String name,
        String title,
        String avatar,
        boolean isVacant,
        String status,
        String level,
        String role,
        String email,
        Integer subordinateCount,
        List<PositionTreeResponse> children,
        String departmentId,
        String departmentName) {
}
