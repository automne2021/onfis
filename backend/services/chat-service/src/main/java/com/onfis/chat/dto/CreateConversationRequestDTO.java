package com.onfis.chat.dto;

import java.util.List;
import java.util.UUID;

public record CreateConversationRequestDTO (
  String name, 
  String type, 
  List<UUID> memberIds
) {}