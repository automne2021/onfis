package com.onfis.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.admin.dto.AddTicketCommentRequest;
import com.onfis.admin.dto.RejectTicketRequest;
import com.onfis.admin.dto.TicketCommentResponse;
import com.onfis.admin.dto.TicketResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminTicketService {

    private static final String TICKETS_LIST_CACHE = "admin:ticketsList";
    private static final String TICKET_DETAIL_CACHE = "admin:ticketDetail";
    private static final Set<String> FINAL_EXEC_STATUSES = Set.of("COMPLETED", "CANCELLED");
    private static final Set<String> ALLOWED_CATEGORIES = Set.of("ADD_ACCOUNT", "CHANGE_ROLE", "SYSTEM_CONFIG",
            "STORAGE", "OTHER");
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<TicketResponse>> TICKET_LIST_TYPE = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService accessService;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

    public List<TicketResponse> listTickets(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        AdminAccessService.UserContext actor = accessService.requireAdminOrSuperAdmin(tenantId, userId);

        String cacheKey = buildTicketListCacheKey(tenantId, actor);
        List<TicketResponse> cached = readTicketListFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<TicketRow> tickets = loadTicketRows(tenantId, actor, null);
        Map<UUID, List<TicketCommentResponse>> commentsByRequest = loadCommentsByRequestIds(
                tickets.stream().map(TicketRow::id).toList());

        List<TicketResponse> response = tickets.stream()
                .map(ticket -> toTicketResponse(ticket, commentsByRequest.getOrDefault(ticket.id(), List.of())))
                .toList();

        writeCacheValue(TICKETS_LIST_CACHE, cacheKey, response);
        return response;
    }

    public TicketResponse getTicket(String tenantIdHeader, String userIdHeader, String ticketIdRaw) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID ticketId = accessService.parseUuidHeader(ticketIdRaw, "ticketId");
        AdminAccessService.UserContext actor = accessService.requireAdminOrSuperAdmin(tenantId, userId);

        String cacheKey = buildTicketDetailCacheKey(tenantId, actor, ticketId);
        TicketResponse cached = readCacheValue(TICKET_DETAIL_CACHE, cacheKey, TicketResponse.class);
        if (cached != null) {
            return cached;
        }

        List<TicketRow> rows = loadTicketRows(tenantId, actor, ticketId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found");
        }

        TicketRow ticket = rows.getFirst();
        Map<UUID, List<TicketCommentResponse>> commentsByRequest = loadCommentsByRequestIds(List.of(ticket.id()));
        TicketResponse response = toTicketResponse(ticket, commentsByRequest.getOrDefault(ticket.id(), List.of()));

        writeCacheValue(TICKET_DETAIL_CACHE, cacheKey, response);
        return response;
    }

    public void acceptTicket(String tenantIdHeader, String userIdHeader, String ticketIdRaw) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID ticketId = accessService.parseUuidHeader(ticketIdRaw, "ticketId");
        AdminAccessService.UserContext actor = accessService.requireAdminOrSuperAdmin(tenantId, userId);

        ActionableRequest request = loadActionableRequest(tenantId, actor, ticketId);
        if (!"PENDING".equals(request.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only PENDING tickets can be accepted");
        }

        jdbcTemplate.update(
                """
                        UPDATE executive_requests
                        SET status = 'IN_PROGRESS'
                        WHERE id = ?
                          AND tenant_id = ?
                        """,
                ticketId,
                tenantId);

        evictTicketCaches();
    }

    public void approveTicket(String tenantIdHeader, String userIdHeader, String ticketIdRaw) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID ticketId = accessService.parseUuidHeader(ticketIdRaw, "ticketId");
        AdminAccessService.UserContext actor = accessService.requireAdminOrSuperAdmin(tenantId, userId);

        ActionableRequest request = loadActionableRequest(tenantId, actor, ticketId);
        if (!"IN_PROGRESS".equals(request.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only IN_PROGRESS tickets can be marked complete");
        }

        jdbcTemplate.update(
                """
                        UPDATE executive_requests
                        SET status = 'COMPLETED'
                        WHERE id = ?
                          AND tenant_id = ?
                        """,
                ticketId,
                tenantId);

        evictTicketCaches();
    }

    public void rejectTicket(
            String tenantIdHeader,
            String userIdHeader,
            String ticketIdRaw,
            RejectTicketRequest request) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID ticketId = accessService.parseUuidHeader(ticketIdRaw, "ticketId");
        AdminAccessService.UserContext actor = accessService.requireAdminOrSuperAdmin(tenantId, userId);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        String reason = requireNonBlank(request.reason(), "Reject reason is required");
        ActionableRequest row = loadActionableRequest(tenantId, actor, ticketId);
        ensureNotFinalized(row.status());

        jdbcTemplate.update(
                """
                        UPDATE executive_requests
                        SET status = 'CANCELLED'
                        WHERE id = ?
                          AND tenant_id = ?
                        """,
                ticketId,
                tenantId);

        insertComment(ticketId, actor.userId(), reason, true);
        evictTicketCaches();
    }

    public void addTicketComment(
            String tenantIdHeader,
            String userIdHeader,
            String ticketIdRaw,
            AddTicketCommentRequest request) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID ticketId = accessService.parseUuidHeader(ticketIdRaw, "ticketId");
        AdminAccessService.UserContext actor = accessService.requireAdminOrSuperAdmin(tenantId, userId);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        String content = requireNonBlank(request.content(), "Comment content is required");
        boolean isInternal = request.isInternal() == null || request.isInternal();

        loadActionableRequest(tenantId, actor, ticketId);

        insertComment(ticketId, actor.userId(), content, isInternal);

        jdbcTemplate.update(
                """
                        UPDATE executive_requests
                        SET updated_at = NOW()
                        WHERE id = ?
                          AND tenant_id = ?
                        """,
                ticketId,
                tenantId);

        evictTicketCaches();
    }

    private List<TicketRow> loadTicketRows(
            UUID tenantId,
            AdminAccessService.UserContext actor,
            UUID ticketIdFilter) {
        StringBuilder sql = new StringBuilder(
                """
                        SELECT
                          er.id,
                          er.created_by,
                          er.assigned_to,
                          er.title,
                          er.description,
                          er.priority,
                          er.status,
                          er.metadata::text AS metadata_json,
                          er.created_at,
                          er.updated_at,
                          creator.first_name AS requester_first_name,
                          creator.last_name AS requester_last_name,
                          creator.email AS requester_email,
                          assignee.first_name AS assignee_first_name,
                          assignee.last_name AS assignee_last_name,
                          assignee.email AS assignee_email
                        FROM executive_requests er
                        JOIN users creator ON creator.id = er.created_by
                        LEFT JOIN users assignee ON assignee.id = er.assigned_to
                        WHERE er.tenant_id = ?
                        """);

        List<Object> args = new ArrayList<>();
        args.add(tenantId);

        if (!actor.isSuperAdmin()) {
            sql.append(
                    """
                              AND (
                                er.assigned_to = ?
                                OR EXISTS (
                                  SELECT 1
                                  FROM executive_request_assignees era
                                  WHERE era.request_id = er.id
                                    AND era.user_id = ?
                                )
                              )
                            """);
            args.add(actor.userId());
            args.add(actor.userId());
        }

        if (ticketIdFilter != null) {
            sql.append(" AND er.id = ? ");
            args.add(ticketIdFilter);
        }

        sql.append(" ORDER BY er.created_at DESC ");

        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> mapTicketRow(rs),
                args.toArray());
    }

    private TicketRow mapTicketRow(ResultSet rs) throws SQLException {
        UUID requesterId = rs.getObject("created_by", UUID.class);
        UUID assigneeId = rs.getObject("assigned_to", UUID.class);

        String requesterName = accessService.buildDisplayName(
                rs.getString("requester_first_name"),
                rs.getString("requester_last_name"),
                rs.getString("requester_email"));

        String assigneeName = assigneeId == null
                ? null
                : accessService.buildDisplayName(
                        rs.getString("assignee_first_name"),
                        rs.getString("assignee_last_name"),
                        rs.getString("assignee_email"));

        return new TicketRow(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("priority"),
                rs.getString("status"),
                readMetadata(rs.getString("metadata_json")),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class),
                requesterId,
                requesterName,
                assigneeId,
                assigneeName);
    }

    private Map<UUID, List<TicketCommentResponse>> loadCommentsByRequestIds(List<UUID> requestIds) {
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
                    Map<UUID, List<TicketCommentResponse>> grouped = new LinkedHashMap<>();
                    while (rs.next()) {
                        UUID requestId = rs.getObject("request_id", UUID.class);
                        String authorName = accessService.buildDisplayName(
                                rs.getString("first_name"),
                                rs.getString("last_name"),
                                rs.getString("email"));
                        TicketCommentResponse comment = new TicketCommentResponse(
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

    private TicketResponse toTicketResponse(TicketRow row, List<TicketCommentResponse> comments) {
        String ticketStatus = mapExecStatusToTicketStatus(row.execStatus());

        OffsetDateTime resolvedAt = ("RESOLVED".equals(ticketStatus) || "REJECTED".equals(ticketStatus))
                ? row.updatedAt()
                : null;

        return new TicketResponse(
                row.id(),
                buildTicketCode(row.id()),
                row.title(),
                row.description(),
                row.requesterId(),
                row.requesterName(),
                resolveCategory(row.payload()),
                mapExecPriorityToTicketPriority(row.execPriority()),
                ticketStatus,
                row.createdAt(),
                row.updatedAt(),
                resolvedAt,
                row.assigneeId(),
                row.assigneeName(),
                comments,
                row.payload());
    }

    private ActionableRequest loadActionableRequest(
            UUID tenantId,
            AdminAccessService.UserContext actor,
            UUID ticketId) {
        StringBuilder sql = new StringBuilder(
                """
                        SELECT er.id, er.status
                        FROM executive_requests er
                        WHERE er.tenant_id = ?
                          AND er.id = ?
                        """);

        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        args.add(ticketId);

        if (!actor.isSuperAdmin()) {
            sql.append(
                    """
                              AND (
                                er.assigned_to = ?
                                OR EXISTS (
                                  SELECT 1
                                  FROM executive_request_assignees era
                                  WHERE era.request_id = er.id
                                    AND era.user_id = ?
                                )
                              )
                            """);
            args.add(actor.userId());
            args.add(actor.userId());
        }

        ActionableRequest request = jdbcTemplate.query(
                sql.toString(),
                rs -> rs.next()
                        ? new ActionableRequest(
                                rs.getObject("id", UUID.class),
                                normalizeToken(rs.getString("status")))
                        : null,
                args.toArray());

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found");
        }

        return request;
    }

    private void ensureNotFinalized(String currentStatus) {
        if (FINAL_EXEC_STATUSES.contains(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already finalized");
        }
    }

    private String mapExecPriorityToTicketPriority(String execPriorityRaw) {
        String normalized = normalizeToken(execPriorityRaw);
        if ("URGENT".equals(normalized)) {
            return "CRITICAL";
        }
        if ("HIGH".equals(normalized) || "MEDIUM".equals(normalized) || "LOW".equals(normalized)) {
            return normalized;
        }
        return "MEDIUM";
    }

    private String mapExecStatusToTicketStatus(String execStatusRaw) {
        String normalized = normalizeToken(execStatusRaw);
        return switch (normalized) {
            case "IN_PROGRESS" -> "IN_PROGRESS";
            case "COMPLETED" -> "RESOLVED";
            case "CANCELLED" -> "REJECTED";
            default -> "PENDING";
        };
    }

    private String resolveCategory(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return "OTHER";
        }
        Object category = payload.get("category");
        if (category instanceof String categoryRaw) {
            String normalized = normalizeToken(categoryRaw);
            if (ALLOWED_CATEGORIES.contains(normalized)) {
                return normalized;
            }
        }
        return "OTHER";
    }

    private String buildTicketCode(UUID ticketId) {
        String compact = ticketId.toString().replace("-", "").toUpperCase();
        int length = Math.min(8, compact.length());
        return "TK-" + compact.substring(0, length);
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

    private String buildTicketListCacheKey(UUID tenantId, AdminAccessService.UserContext actor) {
        return tenantId + ":" + actor.userId() + ":" + actor.role();
    }

    private String buildTicketDetailCacheKey(UUID tenantId, AdminAccessService.UserContext actor, UUID ticketId) {
        return buildTicketListCacheKey(tenantId, actor) + ":" + ticketId;
    }

    private List<TicketResponse> readTicketListFromCache(String cacheKey) {
        Cache cache = cacheManager.getCache(TICKETS_LIST_CACHE);
        if (cache == null) {
            return null;
        }

        Cache.ValueWrapper wrapper = cache.get(cacheKey);
        if (wrapper == null || wrapper.get() == null) {
            return null;
        }

        try {
            return objectMapper.convertValue(wrapper.get(), TICKET_LIST_TYPE);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private <T> T readCacheValue(String cacheName, String cacheKey, Class<T> targetType) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            return null;
        }

        Cache.ValueWrapper wrapper = cache.get(cacheKey);
        if (wrapper == null || wrapper.get() == null) {
            return null;
        }

        Object rawValue = wrapper.get();
        if (targetType.isInstance(rawValue)) {
            return targetType.cast(rawValue);
        }

        try {
            return objectMapper.convertValue(rawValue, targetType);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private void writeCacheValue(String cacheName, String cacheKey, Object value) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.put(cacheKey, value);
        }
    }

    private void evictTicketCaches() {
        clearCache(TICKETS_LIST_CACHE);
        clearCache(TICKET_DETAIL_CACHE);
    }

    private void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }

    private void insertComment(UUID requestId, UUID authorId, String content, boolean isInternal) {
        jdbcTemplate.update(
                """
                        INSERT INTO executive_request_comments (request_id, author_id, content, is_internal)
                        VALUES (?, ?, ?, ?)
                        """,
                requestId,
                authorId,
                content,
                isInternal);
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String normalizeToken(String raw) {
        return raw == null ? "" : raw.trim().replaceAll("[\\s-]+", "_").toUpperCase();
    }

    private record TicketRow(
            UUID id,
            String title,
            String description,
            String execPriority,
            String execStatus,
            Map<String, Object> payload,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            UUID requesterId,
            String requesterName,
            UUID assigneeId,
            String assigneeName) {
    }

    private record ActionableRequest(UUID id, String status) {
    }
}
