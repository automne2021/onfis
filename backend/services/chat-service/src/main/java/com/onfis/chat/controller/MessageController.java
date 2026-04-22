package com.onfis.chat.controller;

import com.onfis.chat.dto.ChatMessageRequestDTO;
import com.onfis.chat.config.OnfisPrincipal; 
import com.onfis.chat.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequestDTO request, Principal principal) {
        OnfisPrincipal userPrincipal = (OnfisPrincipal) principal;
        
        messageService.processAndSendMessage(
                request, 
                userPrincipal.getUserId(),
                userPrincipal.getTenantId(),
                userPrincipal.getToken()
        );
    }
}