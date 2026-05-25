package com.onfis.chat.client;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client gọi tới project-service để lấy danh sách tasks.
 * Trả về raw Map để tránh phụ thuộc vào DTOs của project-service.
 */
@FeignClient(name = "project-client", url = "${app.services.project:http://project-service:8082}")
public interface ProjectClient {

    @GetMapping("/projects/tasks/me")
    Map<String, Object> getMyTasks(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-Company-ID") String companyId,
            @RequestParam(defaultValue = "assigned") String tab,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    );
}
