package com.onfis.chat.config; // Đặt đúng package của bạn

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.onfis.chat.service.PresenceService;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = getHeaderValue(accessor, "X-User-ID");
        
        if (userId != null) {
            if (accessor.getSessionAttributes() != null) {
                accessor.getSessionAttributes().put("USER_ID", userId);
            }
            
            // 👉 CHỈ PHÁT THÔNG BÁO NẾU LÀ LẦN KẾT NỐI ĐẦU TIÊN
            boolean isFirstConnection = presenceService.setOnline(userId); 
            if (isFirstConnection) {
                log.info("User goes ONLINE: " + userId);
                broadcastUserStatus(userId, "online");
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = null;
        if (accessor.getSessionAttributes() != null) {
            userId = (String) accessor.getSessionAttributes().get("USER_ID");
        }
        
        if (userId != null) {
            boolean isLastConnection = presenceService.setOffline(userId); 
            if (isLastConnection) {
                log.info("User goes OFFLINE: " + userId);
                broadcastUserStatus(userId, "offline");
            }
        }
    }

    private void broadcastUserStatus(String userId, String status) {
        Map<String, String> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("status", status);
        messagingTemplate.convertAndSend("/topic/users.status", payload);
    }

    // Hàm phụ trợ lấy header
    private String getHeaderValue(StompHeaderAccessor accessor, String headerName) {
        if (accessor.getNativeHeader(headerName) != null) {
            return accessor.getNativeHeader(headerName).get(0);
        }
        return null;
    }
}