package com.onfis.admin.dto;

import java.util.List;
import java.util.Map;

public record TenantSettingsDto(
        String id,
        String name,
        String legalName,
        String taxCode,
        String address,
        String timezone,
        String dateFormat,
        List<String> workingDays,
        List<Map<String, String>> publicHolidays,
        String logoUrl) {
}
