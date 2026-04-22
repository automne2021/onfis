package com.onfis.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
        registry.addEndpoint("/ws-native").setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // 1. Chỉ lấy Authorization Header do Frontend gửi lên trong connectHeaders
                    String fullToken = accessor.getFirstNativeHeader("Authorization");
                    String tenantIdStr = accessor.getFirstNativeHeader("X-Company-ID"); 

                    if (fullToken != null && fullToken.startsWith("Bearer ")) {
                        String cleanToken = fullToken.substring(7);
                        try {
                            // 2. Giải mã Payload của JWT bằng Base64 (Không cần verify chữ ký vì Gateway đã làm việc đó rồi)
                            String[] chunks = cleanToken.split("\\.");
                            if (chunks.length < 2) {
                                throw new IllegalArgumentException("Token không đúng định dạng JWT");
                            }
                            
                            Base64.Decoder decoder = Base64.getUrlDecoder();
                            String payload = new String(decoder.decode(chunks[1]));

                            // 3. Đọc JSON payload để lấy User ID (Supabase thường lưu ID ở trường "sub")
                            ObjectMapper mapper = new ObjectMapper();
                            JsonNode payloadJson = mapper.readTree(payload);
                            
                            // Tùy thuộc vào cấu trúc JWT của bạn, thường ID nằm ở "sub" hoặc "id" hoặc "userId"
                            String userIdStr = payloadJson.has("sub") ? payloadJson.get("sub").asText() : null;
                            
                            if (userIdStr != null) {
                                UUID userId = UUID.fromString(userIdStr);
                                UUID tenantId = (tenantIdStr != null && !tenantIdStr.isEmpty()) ? UUID.fromString(tenantIdStr) : null;

                                // 4. Thiết lập Principal
                                accessor.setUser(new OnfisPrincipal(userId, tenantId, cleanToken));
                                System.out.println("✅ WebSocket (STOMP) kết nối thành công: User=" + userId);
                            } else {
                                System.err.println("❌ WebSocket thất bại: Không tìm thấy User ID trong Token payload");
                                return null;
                            }
                        } catch (Exception e) {
                            System.err.println("❌ Lỗi parse JWT Token trong STOMP: " + e.getMessage());
                            return null;
                        }
                    } else {
                        System.err.println("❌ WebSocket thất bại: STOMP Client không gửi Authorization header, hoặc sai định dạng 'Bearer '");
                        return null;
                    }
                }
                return message;
            }
        });
    }
}