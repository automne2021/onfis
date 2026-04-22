package com.onfis.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatErrorResponseDTO {
    private String errorType;
    private String message;
}