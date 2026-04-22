package com.onfis.announcement.client;

import com.onfis.announcement.dto.PositionResponseDTO;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "position-service", url = "${app.services.position}")
public interface PositionClient {
  @GetMapping("/positions/{id}")
  PositionResponseDTO getPositionById(
      @RequestHeader("Authorization") String token,
      @RequestHeader("X-Company-ID") String companyId, 
      @PathVariable("id") UUID id
  );
}