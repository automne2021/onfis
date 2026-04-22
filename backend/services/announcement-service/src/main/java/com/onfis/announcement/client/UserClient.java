package com.onfis.announcement.client;

import com.onfis.announcement.dto.UserResponseDTO;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${app.services.user}")
public interface UserClient {
  @GetMapping("/users/{id}/profile")
  UserResponseDTO getUserProfile(
      @RequestHeader("Authorization") String token,
      @RequestHeader("X-Company-ID") String companyId, 
      @PathVariable("id") UUID id
  );
}