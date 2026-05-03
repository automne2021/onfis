package com.onfis.announcement.client;

import com.onfis.announcement.dto.AnnouncementDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "chat-service", url = "${app.services.chat:http://onfis-chat-service:8085}")
public interface ChatNotificationClient {
    @PostMapping("/chat/internal/notify/announcement")
    void sendAnnouncementNotification(
        @RequestHeader("Authorization") String token,
        @RequestHeader("X-Company-ID") String tenantId, 
        @RequestBody AnnouncementDTO dto
    );
}