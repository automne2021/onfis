package com.onfis.admin.dto;

public record TenantFeaturesDto(
        boolean chatEnabled,
        boolean announcementsEnabled,
        boolean meetingsEnabled,
        boolean projectManagementEnabled,
        boolean maintenanceMode) {
}
