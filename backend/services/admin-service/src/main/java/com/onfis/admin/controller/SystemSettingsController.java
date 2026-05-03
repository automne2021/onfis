package com.onfis.admin.controller;

import com.onfis.admin.dto.ModuleSettingsDto;
import com.onfis.admin.dto.OperationalSettingsDto;
import com.onfis.admin.dto.SecuritySettingsDto;
import com.onfis.admin.dto.StorageSettingsDto;
import com.onfis.admin.dto.TenantSettingsDto;
import com.onfis.admin.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class SystemSettingsController {

    private final SystemSettingsService settingsService;

    // ─── Tenant ──────────────────────────────────────────────────────────────

    @GetMapping("/tenant")
    public ResponseEntity<TenantSettingsDto> getTenantSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(settingsService.getTenantSettings(tenantId, userId));
    }

    @PutMapping("/tenant")
    public ResponseEntity<TenantSettingsDto> updateTenantSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestBody TenantSettingsDto body) {
        return ResponseEntity.ok(settingsService.updateTenantSettings(tenantId, userId, body));
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    @GetMapping("/storage")
    public ResponseEntity<StorageSettingsDto> getStorageSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(settingsService.getStorageSettings(tenantId, userId));
    }

    @PutMapping("/storage")
    public ResponseEntity<StorageSettingsDto> updateStorageSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestBody StorageSettingsDto body) {
        return ResponseEntity.ok(settingsService.updateStorageSettings(tenantId, userId, body));
    }

    // ─── Modules ─────────────────────────────────────────────────────────────

    @GetMapping("/system/modules")
    public ResponseEntity<ModuleSettingsDto> getModuleSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(settingsService.getModuleSettings(tenantId, userId));
    }

    @PutMapping("/system/modules")
    public ResponseEntity<ModuleSettingsDto> updateModuleSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestBody ModuleSettingsDto body) {
        return ResponseEntity.ok(settingsService.updateModuleSettings(tenantId, userId, body));
    }

    // ─── Security ────────────────────────────────────────────────────────────

    @GetMapping("/system/security")
    public ResponseEntity<SecuritySettingsDto> getSecuritySettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(settingsService.getSecuritySettings(tenantId, userId));
    }

    @PutMapping("/system/security")
    public ResponseEntity<SecuritySettingsDto> updateSecuritySettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestBody SecuritySettingsDto body) {
        return ResponseEntity.ok(settingsService.updateSecuritySettings(tenantId, userId, body));
    }

    // ─── Operations ──────────────────────────────────────────────────────────

    @GetMapping("/system/operations")
    public ResponseEntity<OperationalSettingsDto> getOperationalSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId) {
        return ResponseEntity.ok(settingsService.getOperationalSettings(tenantId, userId));
    }

    @PutMapping("/system/operations")
    public ResponseEntity<OperationalSettingsDto> updateOperationalSettings(
            @RequestHeader("X-Company-ID") String tenantId,
            @RequestHeader("X-User-ID") String userId,
            @RequestBody OperationalSettingsDto body) {
        return ResponseEntity.ok(settingsService.updateOperationalSettings(tenantId, userId, body));
    }
}
