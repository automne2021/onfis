package com.onfis.admin.dto;

import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String userId,
        String userName,
        String action,
        String targetId,
        String targetType,
        String detail,
        String ipAddress,
        String result,
        String timestamp) {
}
