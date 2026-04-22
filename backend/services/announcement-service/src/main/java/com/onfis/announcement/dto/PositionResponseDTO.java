package com.onfis.announcement.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PositionResponseDTO {
  private UUID id;
  private UUID departmentId;
  private String departmentName;
}
