package com.onfis.project.controller;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/projects")
public class ProjectController {
  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health(
      @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
    Map<String, String> response = new HashMap<>();
    response.put("service", "project-service");
    response.put("status", "UP");
    response.put("port", "8082");
    if (companyId != null) response.put("companyId", companyId);
    return ResponseEntity.ok(response);
  }
}
