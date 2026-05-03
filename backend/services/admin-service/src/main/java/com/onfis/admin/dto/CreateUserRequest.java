package com.onfis.admin.dto;

public record CreateUserRequest(
    String email,
    String role,
    String firstName,
    String lastName
) {}
