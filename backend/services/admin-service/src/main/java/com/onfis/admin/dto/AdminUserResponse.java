package com.onfis.admin.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String avatarUrl,
    boolean isActive,
    String level,
    BigDecimal salary,
    String role,
    String positionName,
    String departmentName,
    UUID positionId,
    OffsetDateTime createdAt
) {}
