package com.onfis.user.dto;

import java.util.UUID;

public record PositionResponseDTO(
    UUID id,
    String title,           
    String departmentName   
) {}