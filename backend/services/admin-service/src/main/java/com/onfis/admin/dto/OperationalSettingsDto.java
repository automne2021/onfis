package com.onfis.admin.dto;

public record OperationalSettingsDto(
        boolean maintenanceMode,
        boolean newUserRegistrationEnabled,
        boolean dataExportEnabled,
        String supportContactEmail) {
}
