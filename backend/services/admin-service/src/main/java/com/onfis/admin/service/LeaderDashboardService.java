package com.onfis.admin.service;

import com.onfis.admin.dto.LeaderDashboardResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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
public class LeaderDashboardService {

    private static final String LEADER_DASHBOARD_CACHE = "admin:leaderDashboard";

    private final JdbcTemplate jdbcTemplate;
    private final CacheManager cacheManager;

    public LeaderDashboardResponse getLeaderDashboard(String tenantIdHeader, String userIdHeader) {
        UUID tenantId = parseUuidHeader(tenantIdHeader, "X-Company-ID");
        UUID userId = parseUuidHeader(userIdHeader, "X-User-ID");

        ensureSuperAdmin(tenantId, userId);

        String cacheKey = tenantId.toString();
        LeaderDashboardResponse cached = readFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        int totalEmployees = queryCount("""
                SELECT COUNT(*)
                FROM users
                WHERE tenant_id = ?
                """, tenantId);

        int totalProjects = queryCount("""
                SELECT COUNT(*)
                FROM projects
                WHERE tenant_id = ?
                """, tenantId);

        int activeProjects = queryCount("""
                SELECT COUNT(*)
                FROM projects
                WHERE tenant_id = ?
                  AND status = 'IN_PROGRESS'
                """, tenantId);

        int pendingApprovals = queryCount("""
                SELECT COUNT(*)
                FROM tasks
                WHERE tenant_id = ?
                  AND status = 'IN_REVIEW'
                """, tenantId);

        int onTimeRate = queryCount("""
                SELECT CASE
                  WHEN COUNT(*) = 0 THEN 0
                  ELSE ROUND(
                    100.0 * SUM(
                      CASE
                        WHEN status = 'DONE' AND (updated_at IS NULL OR CAST(updated_at AS DATE) <= due_date) THEN 1
                        ELSE 0
                      END
                    ) / COUNT(*)
                  )
                END
                FROM tasks
                WHERE tenant_id = ?
                  AND due_date IS NOT NULL
                """, tenantId);

        List<LeaderDashboardResponse.DepartmentWorkload> departments = buildDepartmentWorkload(tenantId);
        List<LeaderDashboardResponse.DashboardAlert> alerts = buildAlerts(tenantId, pendingApprovals, departments);

        LeaderDashboardResponse response = new LeaderDashboardResponse(
                totalEmployees,
                activeProjects,
                totalProjects,
                onTimeRate,
                pendingApprovals,
                departments,
                alerts);

        writeToCache(cacheKey, response);
        return response;
    }

    private LeaderDashboardResponse readFromCache(String cacheKey) {
        Cache cache = cacheManager.getCache(LEADER_DASHBOARD_CACHE);
        if (cache == null) {
            return null;
        }

        return cache.get(cacheKey, LeaderDashboardResponse.class);
    }

    private void writeToCache(String cacheKey, LeaderDashboardResponse response) {
        Cache cache = cacheManager.getCache(LEADER_DASHBOARD_CACHE);
        if (cache != null) {
            cache.put(cacheKey, response);
        }
    }

    private void ensureSuperAdmin(UUID tenantId, UUID userId) {
        String role = jdbcTemplate.query(
                "SELECT role FROM users WHERE id = ? AND tenant_id = ? LIMIT 1",
                rs -> rs.next() ? rs.getString(1) : null,
                userId,
                tenantId);

        if (role == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User does not belong to this tenant");
        }

        if (!"SUPER_ADMIN".equals(normalizeRole(role))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN role required");
        }
    }

    private List<LeaderDashboardResponse.DepartmentWorkload> buildDepartmentWorkload(UUID tenantId) {
        List<DepartmentHeadcountRow> rows = jdbcTemplate.query(
                """
                        SELECT d.name AS department_name, COALESCE(COUNT(u.id), 0) AS headcount
                        FROM departments d
                        LEFT JOIN positions p
                          ON p.department_id = d.id
                         AND p.tenant_id = d.tenant_id
                        LEFT JOIN users u
                          ON u.position_id = p.id
                         AND u.tenant_id = d.tenant_id
                        WHERE d.tenant_id = ?
                        GROUP BY d.id, d.name
                        ORDER BY headcount DESC, d.name ASC
                        LIMIT 6
                        """,
                (rs, rowNum) -> new DepartmentHeadcountRow(rs.getString("department_name"), rs.getInt("headcount")),
                tenantId);

        if (rows.isEmpty()) {
            return List.of();
        }

        int maxHeadcount = rows.stream().mapToInt(DepartmentHeadcountRow::headcount).max().orElse(1);
        if (maxHeadcount <= 0) {
            maxHeadcount = 1;
        }

        int normalizedMax = maxHeadcount;
        return rows.stream()
                .map(row -> {
                    int load = (int) Math.round((row.headcount() * 100.0) / normalizedMax);
                    return new LeaderDashboardResponse.DepartmentWorkload(row.name(), Math.min(load, 100), 100);
                })
                .toList();
    }

    private List<LeaderDashboardResponse.DashboardAlert> buildAlerts(
            UUID tenantId,
            int pendingApprovals,
            List<LeaderDashboardResponse.DepartmentWorkload> departments) {
        List<LeaderDashboardResponse.DashboardAlert> alerts = new ArrayList<>();
        String now = OffsetDateTime.now(ZoneOffset.UTC).toString();

        int overdueTasks = queryCount("""
                SELECT COUNT(*)
                FROM tasks
                WHERE tenant_id = ?
                  AND status <> 'DONE'
                  AND due_date < CURRENT_DATE
                """, tenantId);

        if (overdueTasks > 0) {
            String overdueSample = jdbcTemplate.query(
                    """
                            SELECT t.title, p.name AS project_name
                            FROM tasks t
                            LEFT JOIN projects p ON p.id = t.project_id
                            WHERE t.tenant_id = ?
                              AND t.status <> 'DONE'
                              AND t.due_date < CURRENT_DATE
                            ORDER BY t.due_date ASC
                            LIMIT 1
                            """,
                    rs -> {
                        if (!rs.next()) {
                            return "Please review overdue tasks immediately.";
                        }
                        String title = rs.getString("title");
                        String projectName = rs.getString("project_name");
                        if (projectName == null || projectName.isBlank()) {
                            return title;
                        }
                        return title + " (" + projectName + ")";
                    },
                    tenantId);

            alerts.add(new LeaderDashboardResponse.DashboardAlert(
                    UUID.randomUUID().toString(),
                    "overdue",
                    overdueTasks + " overdue task" + (overdueTasks > 1 ? "s" : ""),
                    overdueSample,
                    overdueTasks >= 5 ? "high" : "medium",
                    now));
        }

        if (pendingApprovals > 0) {
            alerts.add(new LeaderDashboardResponse.DashboardAlert(
                    UUID.randomUUID().toString(),
                    "pending",
                    pendingApprovals + " item" + (pendingApprovals > 1 ? "s" : "") + " waiting for review",
                    "Tasks are waiting in review queue and need leader attention.",
                    pendingApprovals >= 10 ? "high" : "medium",
                    now));
        }

        departments.stream()
                .max(java.util.Comparator.comparingInt(LeaderDashboardResponse.DepartmentWorkload::load))
                .filter(max -> max.load() >= 70)
                .ifPresent(max -> alerts.add(new LeaderDashboardResponse.DashboardAlert(
                        UUID.randomUUID().toString(),
                        "bottleneck",
                        max.name() + " workload at " + max.load() + "%",
                        "Consider balancing resources to reduce overload in this department.",
                        max.load() >= 90 ? "high" : "medium",
                        now)));

        return alerts;
    }

    private int queryCount(String sql, Object... args) {
        Number number = jdbcTemplate.queryForObject(sql, Number.class, args);
        return number == null ? 0 : number.intValue();
    }

    private UUID parseUuidHeader(String rawValue, String headerName) {
        try {
            return UUID.fromString(rawValue);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, headerName + " must be a valid UUID");
        }
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().replaceAll("[\\s-]+", "_").toUpperCase();
        if ("SUPERADMIN".equals(normalized)) {
            return "SUPER_ADMIN";
        }
        return normalized;
    }

    private record DepartmentHeadcountRow(String name, int headcount) {
    }
}
