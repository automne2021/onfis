package com.onfis.admin.dto;

public record SecuritySettingsDto(
        int passwordMinLength,
        int sessionTimeoutMinutes,
        boolean mfaRequired,
        int loginMaxAttempts,
        int accountLockoutMinutes) {
}
