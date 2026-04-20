package com.onfis.chat.dto;

import lombok.Builder;
import lombok.Data;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatMessageResponseDTO {
  private UUID id;
  private UUID conversationId;
  private UUID userId;
  
  private String senderName;
  private String senderAvatar;
  private String senderStatus;
  
  private String content;
  private String type;
  private boolean isEdited;
  private UUID attachmentId;
  private UUID parentId;
  private ZonedDateTime createdAt;
  private ZonedDateTime updatedAt;

  private MeetingDTO meeting;
}