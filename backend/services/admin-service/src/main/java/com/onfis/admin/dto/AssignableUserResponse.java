package com.onfis.admin.dto;

import java.util.UUID;

public record AssignableUserResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String role,
        String avatarUrl) {
}
