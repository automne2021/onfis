package com.onfis.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Health check and basic user operations
 */
@RestController
@RequestMapping("/users")
public class UserController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health(
            @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
        Map<String, String> response = new HashMap<>();
        response.put("service", "user-service");
        response.put("status", "UP");
        response.put("port", "8081");
        if (companyId != null) {
            response.put("companyId", companyId);
        }
        return ResponseEntity.ok(response);
    }
}
