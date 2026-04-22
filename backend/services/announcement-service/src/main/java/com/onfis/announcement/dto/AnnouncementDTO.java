package com.onfis.announcement.dto;

import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDTO {
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

    private long numberOfLike;
    private long numberOfComments;
    private boolean initialIsLike;

    private List<AttachmentResponseDTO> attachments;
}