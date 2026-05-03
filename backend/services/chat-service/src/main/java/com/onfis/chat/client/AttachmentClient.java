package com.onfis.chat.client;

import com.onfis.chat.dto.AttachmentResponseDTO;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "announcement-service", url = "${app.services.announcement:http://onfis-announcement-service:8086}")
public interface AttachmentClient { 
  @GetMapping("/api/attachments/{id}") 
    AttachmentResponseDTO getAttachmentById(
        @RequestHeader("Authorization") String token,
        @RequestHeader("X-Company-ID") String companyId,
        @PathVariable("id") UUID id
    );
}