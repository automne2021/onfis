package com.onfis.admin.dto;

import java.util.List;

public record AuditLogPageResponse(
        List<AuditLogResponse> logs,
        int total) {
}
