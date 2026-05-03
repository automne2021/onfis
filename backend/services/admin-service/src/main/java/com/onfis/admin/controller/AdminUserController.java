package com.onfis.admin.controller;

import com.onfis.admin.dto.AdminUserResponse;
import com.onfis.admin.dto.CreateUserRequest;
import com.onfis.admin.service.AdminAccessService;
import com.onfis.admin.service.AdminUserService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService userService;
    private final AdminAccessService accessService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        AdminUserService.ListUsersResult result =
                userService.listUsers(tenantId, departmentId, status, role, page, size);

        // Map to frontend expected format
        List<Map<String, Object>> userMaps = result.users().stream()
                .map(this::toFrontendMap)
                .toList();

        return ResponseEntity.ok(Map.of(
                "users", userMaps,
                "total", result.total()
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestBody CreateUserRequest request) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor =
                accessService.requireAdminOrSuperAdmin(tenantId, userId);

        AdminUserResponse user = userService.createUser(tenantId, request, actor);
        return ResponseEntity.ok(toFrontendMap(user));
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<Void> updateRole(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID actorId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor =
                accessService.requireAdminOrSuperAdmin(tenantId, actorId);

        userService.updateRole(tenantId, userId, body.get("role"), actor);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{userId}/disable")
    public ResponseEntity<Void> disableUser(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @PathVariable UUID userId) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID actorId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor =
                accessService.requireAdminOrSuperAdmin(tenantId, actorId);

        userService.disableUser(tenantId, userId, actor);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{userId}/enable")
    public ResponseEntity<Void> enableUser(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @PathVariable UUID userId) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID actorId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor =
                accessService.requireAdminOrSuperAdmin(tenantId, actorId);

        userService.enableUser(tenantId, userId, actor);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @PathVariable UUID userId) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID actorId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor =
                accessService.requireAdminOrSuperAdmin(tenantId, actorId);

        userService.resetPassword(tenantId, userId, actor);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/force-logout")
    public ResponseEntity<Void> forceLogout(
            @RequestHeader("X-Company-ID") String tenantIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @PathVariable UUID userId) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID actorId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor =
                accessService.requireAdminOrSuperAdmin(tenantId, actorId);

        userService.forceLogout(tenantId, userId, actor);
        return ResponseEntity.ok().build();
    }

    // ─── Map to frontend AdminUser shape ─────────────────────────────────────────

    private Map<String, Object> toFrontendMap(AdminUserResponse u) {
        String displayName = "";
        if (u.firstName() != null && u.lastName() != null) {
            displayName = u.lastName() + " " + u.firstName();
        } else if (u.lastName() != null) {
            displayName = u.lastName();
        } else if (u.firstName() != null) {
            displayName = u.firstName();
        } else if (u.email() != null) {
            displayName = u.email();
        }

        String statusStr = u.isActive() ? "ACTIVE" : "INACTIVE";

        java.util.LinkedHashMap<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", u.id());
        map.put("name", displayName);
        map.put("email", u.email());
        map.put("role", u.role());
        map.put("department", u.departmentName());
        map.put("departmentId", null); // not directly available
        map.put("position", u.positionName());
        map.put("status", statusStr);
        map.put("avatarUrl", u.avatarUrl());
        map.put("createdAt", u.createdAt() != null ? u.createdAt().toString() : null);
        map.put("lastLogin", null); // not tracked in DB yet
        return map;
    }
}
