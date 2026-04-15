package com.onfis.announcement.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
  private UUID id;
  private UUID tenantId;
  private String firstName;
  private String lastName;
  private String avatarUrl;
  private String email;
  private String role;
  private UUID positionId;
}
