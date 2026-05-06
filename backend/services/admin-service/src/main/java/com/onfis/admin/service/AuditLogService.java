package com.onfis.admin.service;

import com.onfis.admin.dto.AuditLogPageResponse;
import com.onfis.admin.dto.AuditLogResponse;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final String AUDIT_LOGS_CACHE = "admin:auditLogs";

    private final JdbcTemplate jdbcTemplate;
    private final CacheManager cacheManager;
    private final AdminAccessService accessService;

    public AuditLogPageResponse listAuditLogs(
            String tenantIdHeader,
            String userIdHeader,
            String filterUserId,
            String action,
            String result,
            String from,
            String to,
            int page,
            int size) {

        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID requestorId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, requestorId);

        int safeSize = Math.min(Math.max(size, 1), 100);
        int safeOffset = Math.max(page, 0) * safeSize;

        String cacheKey = buildCacheKey(tenantId, filterUserId, action, result, from, to, page, safeSize);
        Cache cache = cacheManager.getCache(AUDIT_LOGS_CACHE);
        if (cache != null) {
            AuditLogPageResponse cached = cache.get(cacheKey, AuditLogPageResponse.class);
            if (cached != null)
                return cached;
        }

        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE al.tenant_id = ?");
        params.add(tenantId);

        if (filterUserId != null && !filterUserId.isBlank()) {
            try {
                UUID uid = UUID.fromString(filterUserId);
                where.append(" AND al.actor_id = ?");
                params.add(uid);
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (action != null && !action.isBlank()) {
            where.append(" AND al.action = ?");
            params.add(action.toUpperCase());
        }
        if (result != null && !result.isBlank()) {
            where.append(" AND al.result = ?");
            params.add(result.toUpperCase());
        }
        if (from != null && !from.isBlank()) {
            where.append(" AND al.created_at >= ?::timestamptz");
            params.add(from);
        }
        if (to != null && !to.isBlank()) {
            where.append(" AND al.created_at <= ?::timestamptz");
            params.add(to);
        }

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit_logs al " + where, Integer.class, params.toArray());
        if (total == null)
            total = 0;

        String dataSql = "SELECT al.id, al.actor_id, al.actor_name, al.action,"
                + " al.entity_id, al.entity_type, al.detail, al.ip_address, al.result, al.created_at"
                + " FROM audit_logs al " + where
                + " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(safeSize);
        dataParams.add(safeOffset);

        List<AuditLogResponse> logs = jdbcTemplate.query(
                dataSql,
                (rs, rowNum) -> mapRow(rs),
                dataParams.toArray());

        AuditLogPageResponse response = new AuditLogPageResponse(logs, total);
        if (cache != null)
            cache.put(cacheKey, response);
        return response;
    }

    public AuditLogResponse getAuditLog(String tenantIdHeader, String userIdHeader, String logIdRaw) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        UUID logId = accessService.parseUuidHeader(logIdRaw, "logId");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        return jdbcTemplate.query(
                """
                        SELECT id, actor_id, actor_name, action, entity_id, entity_type,
                               detail, ip_address, result, created_at
                        FROM audit_logs
                        WHERE id = ? AND tenant_id = ?
                        LIMIT 1
                        """,
                rs -> {
                    if (!rs.next()) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit log not found");
                    }
                    return mapRow(rs);
                },
                logId, tenantId);
    }

    /**
     * Write an explicit semantic audit entry for admin-service actions that benefit
     * from
     * richer context beyond what the DB trigger captures (e.g. TICKET_APPROVED,
     * FORCE_LOGOUT).
     */
    public void logAction(
            UUID tenantId,
            UUID actorId,
            String actorName,
            String actorRole,
            String entityType,
            UUID entityId,
            String action,
            String detail,
            String ipAddress,
            String result) {
        jdbcTemplate.update(
                """
                        INSERT INTO audit_logs
                            (tenant_id, actor_id, actor_name, actor_role,
                             entity_type, entity_id, action, detail, ip_address, result)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                tenantId, actorId, actorName, actorRole,
                entityType, entityId, action, detail, ipAddress, result);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private AuditLogResponse mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        String actorId = rs.getString("actor_id");
        String actorName = rs.getString("actor_name");
        if (actorName == null || actorName.isBlank()) {
            actorName = actorId != null ? actorId.substring(0, Math.min(8, actorId.length())) : "system";
        }
        OffsetDateTime ts = rs.getObject("created_at", OffsetDateTime.class);
        return new AuditLogResponse(
                (UUID) rs.getObject("id"),
                actorId,
                actorName,
                rs.getString("action"),
                rs.getString("entity_id"),
                rs.getString("entity_type"),
                rs.getString("detail"),
                rs.getString("ip_address"),
                rs.getString("result"),
                ts == null ? null : ts.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
    }

    private String buildCacheKey(
            UUID tenantId, String userId, String action, String result,
            String from, String to, int page, int size) {
        return tenantId + "|" + userId + "|" + action + "|" + result
                + "|" + from + "|" + to + "|" + page + "|" + size;
    }
}
