package com.onfis.admin.service;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminAccessService {

    private final JdbcTemplate jdbcTemplate;

    public UUID parseUuidHeader(String rawValue, String headerName) {
        try {
            return UUID.fromString(rawValue);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, headerName + " must be a valid UUID");
        }
    }

    public UserContext requireUserInTenant(UUID tenantId, UUID userId) {
        UserRow row = jdbcTemplate.query(
                """
                        SELECT role, first_name, last_name, email
                        FROM users
                        WHERE id = ?
                          AND tenant_id = ?
                        LIMIT 1
                        """,
                rs -> rs.next()
                        ? new UserRow(
                                rs.getString("role"),
                                rs.getString("first_name"),
                                rs.getString("last_name"),
                                rs.getString("email"))
                        : null,
                userId,
                tenantId);

        if (row == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User does not belong to this tenant");
        }

        return new UserContext(
                userId,
                tenantId,
                normalizeRole(row.role()),
                buildDisplayName(row.firstName(), row.lastName(), row.email()),
                row.email());
    }

    public UserContext requireSuperAdmin(UUID tenantId, UUID userId) {
        UserContext context = requireUserInTenant(tenantId, userId);
        if (!context.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN role required");
        }
        return context;
    }

    public UserContext requireAdminOrSuperAdmin(UUID tenantId, UUID userId) {
        UserContext context = requireUserInTenant(tenantId, userId);
        if (!context.isAdmin() && !context.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
        return context;
    }

    public String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().replaceAll("[\\s-]+", "_").toUpperCase();
        if ("SUPERADMIN".equals(normalized)) {
            return "SUPER_ADMIN";
        }
        return normalized;
    }

    public String buildDisplayName(String firstName, String lastName, String emailFallback) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();

        if (!first.isEmpty() && !last.isEmpty()) {
            return last + " " + first;
        }
        if (!last.isEmpty()) {
            return last;
        }
        if (!first.isEmpty()) {
            return first;
        }
        return emailFallback;
    }

    private record UserRow(String role, String firstName, String lastName, String email) {
    }

    public record UserContext(
            UUID userId,
            UUID tenantId,
            String role,
            String displayName,
            String email) {

        public boolean isSuperAdmin() {
            return "SUPER_ADMIN".equals(role);
        }

        public boolean isAdmin() {
            return "ADMIN".equals(role);
        }
    }
}
