package com.onfis.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMeetingDTO {
    private UUID conversationId;
    private String type; // "VIDEO" hoặc "AUDIO"
}