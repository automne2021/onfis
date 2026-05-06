package com.onfis.admin.dto;

public record ModuleSettingsDto(
        boolean chatEnabled,
        boolean announcementsEnabled,
        boolean meetingsEnabled,
        boolean projectManagementEnabled) {
}
