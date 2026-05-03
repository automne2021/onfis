package com.onfis.admin.dto;

import java.util.List;

public record AdminDashboardResponse(
        int totalUsers,
        int activeUsers,
        int inactiveUsers,
        int suspended,
        int pendingTickets,
        int resolvedToday,
        int totalDepts,
        int newThisMonth,
        List<RecentTicket> recentTickets,
        List<RecentAuditEntry> recentAudit,
        List<RoleDistribution> roleDistribution) {

    public record RecentTicket(
            String id,
            String code,
            String title,
            String priority,
            String status,
            String requester,
            String createdAt) {
    }

    public record RecentAuditEntry(
            String id,
            String action,
            String actor,
            String target,
            String ts) {
    }

    public record RoleDistribution(
            String role,
            int count) {
    }
}
