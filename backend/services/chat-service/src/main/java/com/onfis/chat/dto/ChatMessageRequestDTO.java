package com.onfis.chat.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ChatMessageRequestDTO {
  private UUID conversationId; 
  private String content;
  private String type;
  private UUID attachmentId;
  private UUID parentId;
}
