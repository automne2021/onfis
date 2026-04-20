package com.onfis.chat.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ConversationResponseDTO {
    private UUID id;
    private String name;
    private String type; 
    private String avatarUrl;
    private String status;
    private int membersCount;
    private boolean isPinned;
    private int unreadCount;
}