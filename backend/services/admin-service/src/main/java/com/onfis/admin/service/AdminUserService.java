package com.onfis.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.admin.dto.AdminUserResponse;
import com.onfis.admin.dto.CreateUserRequest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService accessService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String supabaseServiceRoleKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String USER_QUERY = """
            SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                   u.avatar_url, u.is_active, u.level, u.salary, u.role,
                   u.position_id, u.created_at,
                   p.title AS position_name,
                   d.name AS department_name
            FROM users u
            LEFT JOIN positions p ON p.id = u.position_id AND p.tenant_id = u.tenant_id
            LEFT JOIN departments d ON d.id = p.department_id AND d.tenant_id = u.tenant_id
            """;

    // ─── List users ──────────────────────────────────────────────────────────────

    public record ListUsersResult(List<AdminUserResponse> users, int total) {}

    public ListUsersResult listUsers(UUID tenantId, String departmentId,
                                     String status, String role, int page, int size) {
        StringBuilder where = new StringBuilder("WHERE u.tenant_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);

        if (departmentId != null && !departmentId.isBlank()) {
            where.append(" AND p.department_id = ?");
            params.add(UUID.fromString(departmentId));
        }
        if (status != null && !status.isBlank()) {
            where.append(" AND u.is_active = ?");
            params.add("ACTIVE".equalsIgnoreCase(status));
        }
        if (role != null && !role.isBlank()) {
            where.append(" AND u.role = ?");
            params.add(role.toUpperCase());
        }

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u LEFT JOIN positions p ON p.id = u.position_id AND p.tenant_id = u.tenant_id " + where,
                Integer.class, params.toArray());

        params.add(size);
        params.add(page * size);

        List<AdminUserResponse> users = jdbcTemplate.query(
                USER_QUERY + where + " ORDER BY u.created_at DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> mapUser(rs),
                params.toArray()
        );

        return new ListUsersResult(users, total == null ? 0 : total);
    }

    // ─── Create user ─────────────────────────────────────────────────────────────

    public AdminUserResponse createUser(UUID tenantId, CreateUserRequest request,
                                        AdminAccessService.UserContext actor) {
        String email = request.email();
        String userRole = request.role() != null ? request.role().toUpperCase() : "EMPLOYEE";

        if (!List.of("EMPLOYEE", "ADMIN", "MANAGER").contains(userRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Role must be EMPLOYEE, ADMIN, or MANAGER");
        }

        Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ? AND tenant_id = ?",
                Integer.class, email, tenantId);
        if (existing != null && existing > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A user with this email already exists in this tenant");
        }

        try {
            String username = email.split("@")[0];
            Map<String, Object> body = Map.of(
                    "email", email,
                    "password", "123456",
                    "email_confirm", true,
                    "user_metadata", Map.of(
                            "tenant_id", tenantId.toString(),
                            "role", userRole,
                            "username", username
                    )
            );

            HttpResponse<String> response = supabasePost(
                    "/auth/v1/admin/users", objectMapper.writeValueAsString(body));

            if (response.statusCode() >= 400) {
                log.error("Supabase createUser failed: {} {}", response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Failed to create auth user: " + response.body());
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String userId = responseJson.get("id").asText();

            // Update first_name and last_name if provided
            if (request.firstName() != null || request.lastName() != null) {
                jdbcTemplate.update(
                        "UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name) WHERE id = ?::uuid",
                        request.firstName(), request.lastName(), userId);
            }

            audit(tenantId, actor, "CREATE_USER", "USER",
                    UUID.fromString(userId), "Created user: " + email);

            // Fetch and return
            List<AdminUserResponse> result = jdbcTemplate.query(
                    USER_QUERY + "WHERE u.id = ?::uuid",
                    (rs, rowNum) -> mapUser(rs),
                    userId
            );

            if (result.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "User created in auth but not found in database");
            }
            return result.get(0);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create user via Supabase", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to create user: " + e.getMessage());
        }
    }

    // ─── Update role ─────────────────────────────────────────────────────────────

    public void updateRole(UUID tenantId, UUID userId, String newRole,
                           AdminAccessService.UserContext actor) {
        String normalized = newRole.trim().toUpperCase();
        if (!List.of("EMPLOYEE", "ADMIN", "MANAGER", "ACCOUNTANT").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + newRole);
        }

        int updated = jdbcTemplate.update(
                "UPDATE users SET role = ? WHERE id = ? AND tenant_id = ?",
                normalized, userId, tenantId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        audit(tenantId, actor, "UPDATE_USER_ROLE", "USER",
                userId, "Changed role to " + normalized);
    }

    // ─── Disable / Enable ────────────────────────────────────────────────────────

    public void disableUser(UUID tenantId, UUID userId,
                            AdminAccessService.UserContext actor) {
        int updated = jdbcTemplate.update(
                "UPDATE users SET is_active = false WHERE id = ? AND tenant_id = ?",
                userId, tenantId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        audit(tenantId, actor, "DISABLE_USER", "USER", userId, "Disabled user account");
    }

    public void enableUser(UUID tenantId, UUID userId,
                           AdminAccessService.UserContext actor) {
        int updated = jdbcTemplate.update(
                "UPDATE users SET is_active = true WHERE id = ? AND tenant_id = ?",
                userId, tenantId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        audit(tenantId, actor, "ENABLE_USER", "USER", userId, "Enabled user account");
    }

    // ─── Reset password ──────────────────────────────────────────────────────────

    public void resetPassword(UUID tenantId, UUID userId,
                              AdminAccessService.UserContext actor) {
        verifyUserInTenant(userId, tenantId);

        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of("password", "123456"));
            HttpResponse<String> response = supabasePut(
                    "/auth/v1/admin/users/" + userId, jsonBody);

            if (response.statusCode() >= 400) {
                log.error("Supabase resetPassword failed: {}", response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to reset password");
            }

            audit(tenantId, actor, "RESET_PASSWORD", "USER", userId, "Reset password to default");

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to reset password via Supabase", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to reset password");
        }
    }

    // ─── Force logout ────────────────────────────────────────────────────────────

    public void forceLogout(UUID tenantId, UUID userId,
                            AdminAccessService.UserContext actor) {
        verifyUserInTenant(userId, tenantId);

        try {
            HttpResponse<String> response = supabasePost(
                    "/auth/v1/admin/users/" + userId + "/logout", "{}");

            if (response.statusCode() >= 400) {
                log.error("Supabase forceLogout failed: {}", response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to force logout");
            }

            audit(tenantId, actor, "FORCE_LOGOUT", "USER", userId, "Force logged out user");

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to force logout via Supabase", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to force logout");
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private AdminUserResponse mapUser(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new AdminUserResponse(
                UUID.fromString(rs.getString("id")),
                rs.getString("username"),
                rs.getString("email"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                rs.getString("avatar_url"),
                rs.getBoolean("is_active"),
                rs.getString("level"),
                rs.getBigDecimal("salary"),
                rs.getString("role"),
                rs.getString("position_name"),
                rs.getString("department_name"),
                rs.getString("position_id") != null
                        ? UUID.fromString(rs.getString("position_id")) : null,
                rs.getObject("created_at", OffsetDateTime.class)
        );
    }

    private void verifyUserInTenant(UUID userId, UUID tenantId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ? AND tenant_id = ?",
                Integer.class, userId, tenantId);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    private void audit(UUID tenantId, AdminAccessService.UserContext actor,
                       String action, String entityType, UUID entityId, String detail) {
        auditLogService.logAction(
                tenantId, actor.userId(), actor.displayName(), actor.role(),
                entityType, entityId, action, detail, null, "SUCCESS");
    }

    private HttpResponse<String> supabasePost(String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + path))
                .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                .header("apikey", supabaseServiceRoleKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> supabasePut(String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + path))
                .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                .header("apikey", supabaseServiceRoleKey)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
