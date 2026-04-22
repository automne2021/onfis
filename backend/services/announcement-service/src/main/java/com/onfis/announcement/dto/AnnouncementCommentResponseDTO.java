package com.onfis.announcement.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementCommentResponseDTO {
    private UUID id;
    private UUID userId;
    
    private String name;       
    private String avatarUrl;  
    private String content;   
    private LocalDateTime date; 
    
    private List<UUID> likes; 
    private List<AnnouncementCommentResponseDTO> replies; 
    
    private UUID announcementId; 
}