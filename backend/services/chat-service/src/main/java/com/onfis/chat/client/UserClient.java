package com.onfis.chat.client;

import com.onfis.chat.dto.UserResponseDTO;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${app.services.user:http://onfis-user-service:8081}")
public interface UserClient {
  @GetMapping("/users/{id}/profile")
  UserResponseDTO getUserProfile(
      @RequestHeader("Authorization") String token,
      @RequestHeader("X-Company-ID") String companyId, 
      @PathVariable("id") UUID id
  );
}