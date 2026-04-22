package com.onfis.chat.exception;

import com.onfis.chat.dto.ChatErrorResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.security.Principal;

@ControllerAdvice 
public class WebSocketExceptionHandler {

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    // Bắt lỗi Phân quyền (Khi user không phải member của group)
    @MessageExceptionHandler(AccessDeniedChatException.class)
    public void handleAccessDeniedException(AccessDeniedChatException ex, Principal principal) {
        if (principal != null) {
            ChatErrorResponseDTO error = new ChatErrorResponseDTO("ACCESS_DENIED", ex.getMessage());
            
            // Gửi tin nhắn lỗi KÍN về cho chính người dùng đó (không ai khác thấy)
            // Kênh Frontend cần lắng nghe là: /user/queue/errors
            messagingTemplate.convertAndSendToUser(
                    principal.getName(), // ID của user lấy từ OnfisPrincipal
                    "/queue/errors", 
                    error
            );
        }
    }
    
    // Bắt các lỗi vặt khác (NullPointer, Database lỗi...)
    @MessageExceptionHandler(Exception.class)
    public void handleGeneralException(Exception ex, Principal principal) {
        if (principal != null) {
            ChatErrorResponseDTO error = new ChatErrorResponseDTO("SERVER_ERROR", "Đã xảy ra lỗi hệ thống: " + ex.getMessage());
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", error);
        }
    }
}