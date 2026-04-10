package com.onfis.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectCustomRoleRequest(
        @NotBlank @Size(max = 80) String name,
        String color
) {
}
