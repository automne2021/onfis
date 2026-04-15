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
public class AnnouncementDetailDTO {
    private UUID id;
    private String title;
    private String content;
    
    private boolean isPinned; 
    
    private LocalDateTime createdAt;
    private String scope; 
    private UUID targetDepartmentId;
    private String targetDepartmentName;

    private UUID authId;
    private String authName;
    private String authDepartment; 
    private String avatarUrl;
    private String email;
    
    private List<AttachmentResponseDTO> attachments;
    private List<UUID> likes; 
    private List<AnnouncementCommentResponseDTO> comments;
    private boolean initialIsLike; 
}