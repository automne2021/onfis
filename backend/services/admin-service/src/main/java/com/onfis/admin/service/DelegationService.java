package com.onfis.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.admin.dto.AssignableUserResponse;
import com.onfis.admin.dto.CreateDelegationRequest;
import com.onfis.admin.dto.DelegationResponse;
import com.onfis.admin.dto.UpdateDelegationStatusRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DelegationService {

    private static final Set<String> ALLOWED_PRIORITIES = Set.of("URGENT", "HIGH", "MEDIUM", "LOW");
    private static final Set<String> ALLOWED_STATUSES = Set.of("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED");
    private static final Set<String> ASSIGNABLE_ROLES = Set.of("ADMIN", "MANAGER");
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService accessService;
    private final ObjectMapper objectMapper;

    public List<DelegationResponse> listDelegations(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireSuperAdmin(tenantId, userId);
        return loadDelegations(tenantId, null);
    }

    public DelegationResponse createDelegation(
            String tenantIdHeader,
            String userIdHeader,
            CreateDelegationRequest request) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor = accessService.requireSuperAdmin(tenantId, userId);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        String title = requireNonBlank(request.title(), "Title is required");
        String description = requireNonBlank(request.description(), "Description is required");
        String priority = normalizePriority(request.priority());
        List<UUID> assigneeIds = parseAssigneeIds(request.assigneeIds());

        validateAssignees(tenantId, assigneeIds);

        UUID primaryAssignee = assigneeIds.size() == 1 ? assigneeIds.get(0) : null;

        UUID delegationId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO executive_requests (
                          tenant_id,
                          created_by,
                          assigned_to,
                          title,
                          description,
                          priority,
                          status,
                          target_role,
                          metadata
                        )
                        VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NULL, ?::jsonb)
                        RETURNING id
                        """,
                UUID.class,
                tenantId,
                actor.userId(),
                primaryAssignee,
                title,
                description,
                priority,
                "{\"source\":\"leader_delegate\"}");

        if (delegationId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to create delegation");
        }

        jdbcTemplate.batchUpdate(
                "INSERT INTO executive_request_assignees (request_id, user_id) VALUES (?, ?)",
                assigneeIds,
                assigneeIds.size(),
                (ps, assigneeId) -> {
                    ps.setObject(1, delegationId);
                    ps.setObject(2, assigneeId);
                });

        return loadDelegationOrThrow(tenantId, delegationId);
    }

    public void updateDelegationStatus(
            String tenantIdHeader,
            String userIdHeader,
            String delegationIdRaw,
            UpdateDelegationStatusRequest request) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID delegationId = accessService.parseUuidHeader(delegationIdRaw, "delegationId");
        accessService.requireSuperAdmin(tenantId, userId);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        String status = normalizeStatus(request.status());

        int updated = jdbcTemplate.update(
                """
                        UPDATE executive_requests
                        SET status = ?
                        WHERE id = ?
                          AND tenant_id = ?
                        """,
                status,
                delegationId,
                tenantId);

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delegation not found");
        }
    }

    public void deleteDelegation(String tenantIdHeader, String userIdHeader, String delegationIdRaw) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID delegationId = accessService.parseUuidHeader(delegationIdRaw, "delegationId");
        accessService.requireSuperAdmin(tenantId, userId);

        int deleted = jdbcTemplate.update(
                """
                        DELETE FROM executive_requests
                        WHERE id = ?
                          AND tenant_id = ?
                        """,
                delegationId,
                tenantId);

        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delegation not found");
        }
    }

    public List<AssignableUserResponse> listAssignableUsers(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireSuperAdmin(tenantId, userId);

        List<AssignableUserResponse> rows = jdbcTemplate.query(
                """
                        SELECT id, first_name, last_name, email, role, avatar_url
                        FROM users
                        WHERE tenant_id = ?
                          AND COALESCE(is_active, TRUE) = TRUE
                        ORDER BY first_name ASC NULLS LAST, last_name ASC NULLS LAST, email ASC
                        """,
                (rs, rowNum) -> new AssignableUserResponse(
                        getRequiredUuid(rs, "id"),
                        rs.getString("first_name"),
                        rs.getString("last_name"),
                        rs.getString("email"),
                        accessService.normalizeRole(rs.getString("role")),
                        rs.getString("avatar_url")),
                tenantId);

        return rows.stream()
                .filter(row -> ASSIGNABLE_ROLES.contains(accessService.normalizeRole(row.role())))
                .toList();
    }

    private DelegationResponse loadDelegationOrThrow(UUID tenantId, UUID delegationId) {
        List<DelegationResponse> rows = loadDelegations(tenantId, delegationId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delegation not found");
        }
        return rows.getFirst();
    }

    private List<DelegationResponse> loadDelegations(UUID tenantId, UUID delegationId) {
        StringBuilder sql = new StringBuilder(
                """
                        SELECT
                          er.id AS request_id,
                          er.tenant_id,
                          er.created_by,
                          er.assigned_to,
                          er.title,
                          er.description,
                          er.priority,
                          er.status,
                          er.target_role,
                          er.metadata::text AS metadata_json,
                          er.created_at,
                          er.updated_at,
                          u.id AS assignee_id,
                          u.first_name AS assignee_first_name,
                          u.last_name AS assignee_last_name,
                          u.email AS assignee_email,
                          u.role AS assignee_role,
                          u.avatar_url AS assignee_avatar_url
                        FROM executive_requests er
                        LEFT JOIN executive_request_assignees era ON era.request_id = er.id
                        LEFT JOIN users u ON u.id = era.user_id
                        WHERE er.tenant_id = ?
                        """);

        List<Object> args = new ArrayList<>();
        args.add(tenantId);

        if (delegationId != null) {
            sql.append(" AND er.id = ? ");
            args.add(delegationId);
        }

        sql.append(" ORDER BY er.created_at DESC, era.assigned_at ASC NULLS LAST ");

        return jdbcTemplate.query(
                sql.toString(),
                ps -> {
                    for (int i = 0; i < args.size(); i++) {
                        ps.setObject(i + 1, args.get(i));
                    }
                },
                rs -> {
                    Map<UUID, MutableDelegation> grouped = new LinkedHashMap<>();
                    while (rs.next()) {
                        UUID requestId = getRequiredUuid(rs, "request_id");
                        MutableDelegation delegation = grouped.computeIfAbsent(
                                requestId,
                                id -> {
                                    try {
                                        return MutableDelegation.fromRow(rs,
                                                readMetadata(rs.getString("metadata_json")));
                                    } catch (SQLException ex) {
                                        throw new IllegalStateException(ex);
                                    }
                                });

                        UUID assigneeId = getNullableUuid(rs, "assignee_id");
                        if (assigneeId != null && delegation.seenAssigneeIds.add(assigneeId)) {
                            delegation.assignees.add(new DelegationResponse.Assignee(
                                    assigneeId,
                                    rs.getString("assignee_first_name"),
                                    rs.getString("assignee_last_name"),
                                    rs.getString("assignee_email"),
                                    accessService.normalizeRole(rs.getString("assignee_role")),
                                    rs.getString("assignee_avatar_url")));
                        }
                    }
                    // Load comments and merge
                    if (!grouped.isEmpty()) {
                        List<UUID> ids = new ArrayList<>(grouped.keySet());
                        Map<UUID, List<DelegationResponse.Comment>> commentsByRequest = loadDelegationComments(ids);
                        grouped.forEach((rid, delegation) -> delegation.comments
                                .addAll(commentsByRequest.getOrDefault(rid, List.of())));
                    }
                    return grouped.values().stream().map(MutableDelegation::toResponse).toList();
                });
    }

    private void validateAssignees(UUID tenantId, List<UUID> assigneeIds) {
        String placeholders = assigneeIds.stream().map(id -> "?").collect(Collectors.joining(","));
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        args.addAll(assigneeIds);

        List<AssigneeValidationRow> rows = jdbcTemplate.query(
                """
                        SELECT id, role, COALESCE(is_active, TRUE) AS is_active
                        FROM users
                        WHERE tenant_id = ?
                          AND id IN (
                        """ + placeholders + ")",
                (rs, rowNum) -> new AssigneeValidationRow(
                        getRequiredUuid(rs, "id"),
                        accessService.normalizeRole(rs.getString("role")),
                        rs.getBoolean("is_active")),
                args.toArray());

        Set<UUID> foundIds = rows.stream().map(AssigneeValidationRow::id).collect(Collectors.toSet());
        List<String> missingIds = assigneeIds.stream()
                .filter(id -> !foundIds.contains(id))
                .map(UUID::toString)
                .toList();

        if (!missingIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Assignee does not exist in tenant: " + String.join(", ", missingIds));
        }

        for (AssigneeValidationRow row : rows) {
            if (!row.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Assignee is inactive: " + row.id());
            }
            if (!ASSIGNABLE_ROLES.contains(row.role())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Assignee must have ADMIN or MANAGER role: " + row.id());
            }
        }
    }

    private List<UUID> parseAssigneeIds(List<String> rawAssigneeIds) {
        if (rawAssigneeIds == null || rawAssigneeIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one assignee is required");
        }

        LinkedHashSet<UUID> deduped = new LinkedHashSet<>();
        for (String rawId : rawAssigneeIds) {
            if (rawId == null || rawId.isBlank()) {
                continue;
            }
            deduped.add(accessService.parseUuidHeader(rawId.trim(), "assigneeId"));
        }

        if (deduped.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one assignee is required");
        }

        return new ArrayList<>(deduped);
    }

    private String normalizePriority(String priorityRaw) {
        String normalized = normalizeToken(priorityRaw);
        if (!ALLOWED_PRIORITIES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported priority: " + priorityRaw);
        }
        return normalized;
    }

    private String normalizeStatus(String statusRaw) {
        String normalized = normalizeToken(statusRaw);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported status: " + statusRaw);
        }
        return normalized;
    }

    private String normalizeToken(String raw) {
        String normalized = raw == null ? "" : raw.trim().replaceAll("[\\s-]+", "_").toUpperCase();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Value is required");
        }
        return normalized;
    }

    private String requireNonBlank(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return value.trim();
    }

    private Map<String, Object> readMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(metadataJson, MAP_TYPE);
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private UUID getRequiredUuid(ResultSet rs, String column) throws SQLException {
        UUID value = rs.getObject(column, UUID.class);
        if (value == null) {
            throw new SQLException("Column " + column + " is unexpectedly null");
        }
        return value;
    }

    private UUID getNullableUuid(ResultSet rs, String column) throws SQLException {
        return rs.getObject(column, UUID.class);
    }

    private record AssigneeValidationRow(UUID id, String role, boolean isActive) {
    }

    private Map<UUID, List<DelegationResponse.Comment>> loadDelegationComments(List<UUID> requestIds) {
        if (requestIds.isEmpty()) {
            return Map.of();
        }
        String placeholders = requestIds.stream().map(id -> "?").collect(Collectors.joining(","));
        return jdbcTemplate.query(
                """
                        SELECT
                          c.id,
                          c.request_id,
                          c.author_id,
                          c.content,
                          c.is_internal,
                          c.created_at,
                          u.first_name,
                          u.last_name,
                          u.email,
                          u.avatar_url
                        FROM executive_request_comments c
                        LEFT JOIN users u ON u.id = c.author_id
                        WHERE c.request_id IN (
                        """ + placeholders + ") ORDER BY c.created_at ASC",
                ps -> {
                    for (int i = 0; i < requestIds.size(); i++) {
                        ps.setObject(i + 1, requestIds.get(i));
                    }
                },
                rs -> {
                    Map<UUID, List<DelegationResponse.Comment>> grouped = new LinkedHashMap<>();
                    while (rs.next()) {
                        UUID requestId = rs.getObject("request_id", UUID.class);
                        String authorName = accessService.buildDisplayName(
                                rs.getString("first_name"),
                                rs.getString("last_name"),
                                rs.getString("email"));
                        DelegationResponse.Comment comment = new DelegationResponse.Comment(
                                rs.getObject("id", UUID.class),
                                rs.getObject("author_id", UUID.class),
                                authorName,
                                rs.getString("avatar_url"),
                                rs.getString("content"),
                                rs.getObject("created_at", OffsetDateTime.class),
                                rs.getBoolean("is_internal"));
                        grouped.computeIfAbsent(requestId, ignored -> new ArrayList<>()).add(comment);
                    }
                    return grouped;
                });
    }

    private static final class MutableDelegation {
        private final UUID id;
        private final UUID tenantId;
        private final UUID createdBy;
        private final UUID assignedTo;
        private final String title;
        private final String description;
        private final String priority;
        private final String status;
        private final String targetRole;
        private final Map<String, Object> metadata;
        private final OffsetDateTime createdAt;
        private final OffsetDateTime updatedAt;
        private final List<DelegationResponse.Assignee> assignees = new ArrayList<>();
        private final Set<UUID> seenAssigneeIds = new HashSet<>();
        private final List<DelegationResponse.Comment> comments = new ArrayList<>();

        private MutableDelegation(
                UUID id,
                UUID tenantId,
                UUID createdBy,
                UUID assignedTo,
                String title,
                String description,
                String priority,
                String status,
                String targetRole,
                Map<String, Object> metadata,
                OffsetDateTime createdAt,
                OffsetDateTime updatedAt) {
            this.id = id;
            this.tenantId = tenantId;
            this.createdBy = createdBy;
            this.assignedTo = assignedTo;
            this.title = title;
            this.description = description;
            this.priority = priority;
            this.status = status;
            this.targetRole = targetRole;
            this.metadata = metadata;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }

        private static MutableDelegation fromRow(ResultSet rs, Map<String, Object> metadata) throws SQLException {
            return new MutableDelegation(
                    rs.getObject("request_id", UUID.class),
                    rs.getObject("tenant_id", UUID.class),
                    rs.getObject("created_by", UUID.class),
                    rs.getObject("assigned_to", UUID.class),
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getString("priority"),
                    rs.getString("status"),
                    rs.getString("target_role"),
                    metadata,
                    rs.getObject("created_at", OffsetDateTime.class),
                    rs.getObject("updated_at", OffsetDateTime.class));
        }

        private DelegationResponse toResponse() {
            return new DelegationResponse(
                    id,
                    tenantId,
                    createdBy,
                    assignedTo,
                    title,
                    description,
                    priority,
                    status,
                    targetRole,
                    metadata,
                    createdAt,
                    updatedAt,
                    List.copyOf(assignees),
                    List.copyOf(comments));
        }
    }
}
