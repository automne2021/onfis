package com.onfis.chat.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("isPinned") 
    private boolean isPinned;
    
    private int unreadCount;
    private UUID targetUserId;
}