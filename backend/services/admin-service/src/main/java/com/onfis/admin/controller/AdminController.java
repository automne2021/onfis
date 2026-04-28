package com.onfis.admin.controller;

import com.onfis.admin.dto.LeaderDashboardResponse;
import com.onfis.admin.service.LeaderDashboardService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

  private final LeaderDashboardService leaderDashboardService;

  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health(
      @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
    Map<String, String> response = new HashMap<>();
    response.put("service", "admin-service");
    response.put("status", "UP");
    response.put("port", "8084");
    if (companyId != null)
      response.put("companyId", companyId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/leader-dashboard")
  public ResponseEntity<LeaderDashboardResponse> getLeaderDashboard(
      @RequestHeader("X-Company-ID") String tenantId,
      @RequestHeader("X-User-ID") String userId) {
    return ResponseEntity.ok(leaderDashboardService.getLeaderDashboard(tenantId, userId));
  }
}
