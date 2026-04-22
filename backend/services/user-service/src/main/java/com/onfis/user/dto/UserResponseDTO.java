package com.onfis.user.dto;

import java.util.UUID;

public record UserResponseDTO(
  UUID id,
  UUID tenantId,
  String firstName,
  String lastName,
  String avatarUrl,
  String email,
  String role,
  UUID positionId,
  String status
) {}