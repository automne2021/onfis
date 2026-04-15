package com.onfis.user.controller;

import com.onfis.user.dto.UserProfileResponseDTO;
import com.onfis.user.dto.UserResponseDTO;
import com.onfis.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Health check and basic user operations */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

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

  @GetMapping("/{id}/profile")
  public ResponseEntity<UserResponseDTO> getBasicUserProfile(
      @PathVariable("id") UUID id
  ) {
    return ResponseEntity.ok(userService.getBasicUserProfile(id));
  }

  @GetMapping("/{id}/profile/detail")
  public ResponseEntity<UserProfileResponseDTO> getFullUserProfile(
      @RequestHeader("Authorization") String token,
      @PathVariable("id") UUID id,
      @RequestHeader("X-Company-ID") String tenantId 
  ) {
    return ResponseEntity.ok(userService.getFullUserProfile(token, id, tenantId));
  }
}
