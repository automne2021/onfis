package com.onfis.admin.controller;

import com.onfis.admin.dto.AuditLogPageResponse;
import com.onfis.admin.dto.AuditLogResponse;
import com.onfis.admin.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/audit-logs")
    public ResponseEntity<AuditLogPageResponse> listAuditLogs(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestParam(name = "userId", required = false) String filterUserId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(auditLogService.listAuditLogs(
                tenantId, userId, filterUserId, action, result, from, to, page, size));
    }

    @GetMapping("/audit-logs/{id}")
    public ResponseEntity<AuditLogResponse> getAuditLog(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @PathVariable String id) {
        return ResponseEntity.ok(auditLogService.getAuditLog(tenantId, userId, id));
    }
}
