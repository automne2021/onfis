package com.onfis.chat.client;

import com.onfis.chat.dto.AttachmentResponseDTO;
import java.util.Map;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "announcement-service", url = "${app.services.announcement:http://onfis-announcement-service:8086}")
public interface AttachmentClient {

    @GetMapping("/api/attachments/{id}")
    AttachmentResponseDTO getAttachmentById(
            @RequestHeader("Authorization") String token,
            @RequestHeader("X-Company-ID") String companyId,
            @PathVariable("id") UUID id
    );

    /**
     * Lấy danh sách thông báo (dùng cho @announcements command).
     * Trả về raw Map để không phụ thuộc vào DTOs của announcement-service.
     */
    @GetMapping("/announcements/all")
    Map<String, Object> getAnnouncements(
            @RequestHeader("Authorization") String token,
            @RequestHeader("X-Company-ID") String companyId,
            @RequestHeader("X-User-ID") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    );
}