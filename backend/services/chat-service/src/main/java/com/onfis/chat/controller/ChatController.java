package com.onfis.chat.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health(@RequestHeader(value = "X-Company-ID", required = false) String companyId) {
        Map<String, String> response = new HashMap<>();
        response.put("service", "chat-service");
        response.put("status", "UP");
        response.put("port", "8085");
        if (companyId != null) response.put("companyId", companyId);
        return ResponseEntity.ok(response);
    }
}
