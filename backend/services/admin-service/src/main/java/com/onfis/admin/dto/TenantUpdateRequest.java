package com.onfis.admin.dto;

/**
 * Request DTO for updating tenant info during initial setup.
 * All fields are optional — only non-null values will be applied.
 */
public record TenantUpdateRequest(
    String name,
    String companySize,
    String logoUrl,
    Boolean setupCompleted
) {}
