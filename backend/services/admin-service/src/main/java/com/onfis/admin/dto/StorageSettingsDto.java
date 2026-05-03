package com.onfis.admin.dto;

import java.util.List;

public record StorageSettingsDto(
        long totalQuotaMb,
        long usedMb,
        int maxFileSizeMb,
        List<String> allowedExtensions,
        String bucketName) {
}
