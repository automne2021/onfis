package com.onfis.admin.dto;

import java.util.List;

public record LeaderDashboardResponse(
        int totalEmployees,
        int activeProjects,
        int totalProjects,
        int onTimeRate,
        int pendingApprovals,
        List<DepartmentWorkload> departments,
        List<DashboardAlert> alerts) {

    public record DepartmentWorkload(String name, int load, int maxLoad) {
    }

    public record DashboardAlert(
            String id,
            String type,
            String title,
            String description,
            String severity,
            String createdAt) {
    }
}
