package com.onfis.user.client;

import com.onfis.user.dto.PositionResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;
@FeignClient(name = "position-service", url = "${app.services.position}")
public interface PositionServiceClient {

    @GetMapping("/positions/{id}")
    PositionResponseDTO getPositionById(
        @RequestHeader("Authorization") String token,
        @PathVariable("id") UUID id,
        @RequestHeader("X-Company-ID") String tenantId // Chuyền tenantId đi để check quyền nếu cần
    );
}