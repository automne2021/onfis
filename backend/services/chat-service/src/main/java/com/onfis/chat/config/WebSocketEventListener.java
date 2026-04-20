package com.onfis.chat.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    // Đổi UserClient thành StringRedisTemplate
    private final StringRedisTemplate redisTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = headerAccessor.getFirstNativeHeader("X-User-ID");
        
        if (userId != null) {
            log.info("User connected: {}", userId);
            
            // Lưu vào session để lúc disconnect còn biết đường lấy ra
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                sessionAttributes.put("userId", userId);
            }
            
            // GHI THẲNG TRẠNG THÁI VÀO REDIS
            String redisKey = "user:status:" + userId;
            redisTemplate.opsForValue().set(redisKey, "online");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        
        if (sessionAttributes != null) {
            String userId = (String) sessionAttributes.get("userId");
            
            if (userId != null) {
                log.info("User disconnected: {}", userId);
                
                // XÓA TRẠNG THÁI KHỎI REDIS KHI NGẮT KẾT NỐI
                String redisKey = "user:status:" + userId;
                redisTemplate.delete(redisKey);
            }
        }
    }
}