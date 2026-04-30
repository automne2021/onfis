package com.onfis.admin.service;

import com.onfis.admin.dto.AdminDashboardResponse;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final String DASHBOARD_CACHE = "admin:dashboard";

    private final JdbcTemplate jdbcTemplate;
    private final CacheManager cacheManager;
    private final AdminAccessService accessService;

    public AdminDashboardResponse getDashboard(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = accessService.parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = accessService.parseUuidHeader(userIdHeader, "X-User-ID");
        accessService.requireAdminOrSuperAdmin(tenantId, userId);

        String cacheKey = tenantId.toString();
        Cache cache = cacheManager.getCache(DASHBOARD_CACHE);
        if (cache != null) {
            AdminDashboardResponse cached = cache.get(cacheKey, AdminDashboardResponse.class);
            if (cached != null)
                return cached;
        }

        AdminDashboardResponse response = buildDashboard(tenantId);
        if (cache != null)
            cache.put(cacheKey, response);
        return response;
    }

    private AdminDashboardResponse buildDashboard(UUID tenantId) {
        int totalUsers = queryCount(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ?", tenantId);
        int activeUsers = queryCount(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND is_active = true", tenantId);
        int inactiveUsers = queryCount(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND is_active = false", tenantId);
        int pendingTickets = queryCount(
                "SELECT COUNT(*) FROM executive_requests WHERE tenant_id = ? AND status IN ('PENDING','IN_PROGRESS')",
                tenantId);
        int resolvedToday = queryCount(
                "SELECT COUNT(*) FROM executive_requests WHERE tenant_id = ? AND status = 'COMPLETED'"
                        + " AND (updated_at AT TIME ZONE 'UTC')::date = CURRENT_DATE",
                tenantId);
        int totalDepts = queryCount(
                "SELECT COUNT(*) FROM departments WHERE tenant_id = ?", tenantId);
        int newThisMonth = queryCount(
                "SELECT COUNT(*) FROM departments WHERE tenant_id = ?"
                        + " AND date_trunc('month', created_at) = date_trunc('month', CURRENT_TIMESTAMP)",
                tenantId);

        List<AdminDashboardResponse.RecentTicket> recentTickets = buildRecentTickets(tenantId);
        List<AdminDashboardResponse.RecentAuditEntry> recentAudit = buildRecentAudit(tenantId);
        List<AdminDashboardResponse.RoleDistribution> roleDistribution = buildRoleDistribution(tenantId);

        return new AdminDashboardResponse(
                totalUsers, activeUsers, inactiveUsers, 0,
                pendingTickets, resolvedToday,
                totalDepts, newThisMonth,
                recentTickets, recentAudit, roleDistribution);
    }

    private int queryCount(String sql, UUID tenantId) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tenantId);
        return count == null ? 0 : count;
    }

    private List<AdminDashboardResponse.RecentTicket> buildRecentTickets(UUID tenantId) {
        return jdbcTemplate.query(
                """
                        SELECT er.id, er.title, er.priority, er.status,
                               u.first_name, u.last_name, u.email, er.created_at
                        FROM executive_requests er
                        LEFT JOIN users u ON u.id = er.created_by AND u.tenant_id = er.tenant_id
                        WHERE er.tenant_id = ?
                        ORDER BY er.created_at DESC
                        LIMIT 5
                        """,
                (rs, rowNum) -> {
                    String ticketId = rs.getString("id");
                    String code = buildTicketCode(UUID.fromString(ticketId));
                    String requester = accessService.buildDisplayName(
                            rs.getString("first_name"),
                            rs.getString("last_name"),
                            rs.getString("email"));
                    return new AdminDashboardResponse.RecentTicket(
                            ticketId, code,
                            rs.getString("title"),
                            rs.getString("priority"),
                            rs.getString("status"),
                            requester,
                            formatTs(rs.getObject("created_at", OffsetDateTime.class)));
                },
                tenantId);
    }

    private List<AdminDashboardResponse.RecentAuditEntry> buildRecentAudit(UUID tenantId) {
        return jdbcTemplate.query(
                """
                        SELECT id, action, actor_name, actor_id, entity_type, entity_id, created_at
                        FROM audit_logs
                        WHERE tenant_id = ?
                        ORDER BY created_at DESC
                        LIMIT 5
                        """,
                (rs, rowNum) -> {
                    String actorName = rs.getString("actor_name");
                    if (actorName == null || actorName.isBlank()) {
                        String actorId = rs.getString("actor_id");
                        actorName = actorId != null ? actorId.substring(0, 8) : "system";
                    }
                    String entityType = rs.getString("entity_type");
                    String entityId = rs.getString("entity_id");
                    String target = entityType != null
                            ? entityType + (entityId != null ? ":" + entityId.substring(0, 8) : "")
                            : "system";
                    return new AdminDashboardResponse.RecentAuditEntry(
                            rs.getString("id"),
                            rs.getString("action"),
                            actorName,
                            target,
                            formatTs(rs.getObject("created_at", OffsetDateTime.class)));
                },
                tenantId);
    }

    private List<AdminDashboardResponse.RoleDistribution> buildRoleDistribution(UUID tenantId) {
        return jdbcTemplate.query(
                "SELECT role, COUNT(*) AS cnt FROM users WHERE tenant_id = ? GROUP BY role ORDER BY cnt DESC",
                (rs, rowNum) -> new AdminDashboardResponse.RoleDistribution(
                        rs.getString("role"),
                        rs.getInt("cnt")),
                tenantId);
    }

    private String buildTicketCode(UUID id) {
        String compact = id.toString().replace("-", "").toUpperCase();
        return "TK-" + compact.substring(0, Math.min(8, compact.length()));
    }

    private String formatTs(OffsetDateTime ts) {
        return ts == null ? null : ts.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
