package com.onfis.position.dto;

public record PositionMeResponse(
        String userId,
        String level,
        String role,
        String positionId,
        String positionTitle) {
}
