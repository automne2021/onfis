package com.onfis.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.chat.dto.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisSubscriber {

    private final ObjectMapper objectMapper;
    private final SimpMessageSendingOperations messagingTemplate;

    // SỬA Ở ĐÂY: Xóa "byte[] pattern", chỉ giữ lại String message
    public void onMessage(String message) {
        try {
            // Redis gửi text, cần parse lại thành DTO
            ChatMessageResponseDTO chatMessage = objectMapper.readValue(message, ChatMessageResponseDTO.class);
            
            // SỬA Ở ĐÂY: Đổi getRoomId() thành getConversationId()
            String destination = "/topic/room." + chatMessage.getConversationId();
            messagingTemplate.convertAndSend(destination, chatMessage);
            
        } catch (Exception e) {
            log.error("Lỗi khi parse tin nhắn từ Redis", e);
        }
    }
}