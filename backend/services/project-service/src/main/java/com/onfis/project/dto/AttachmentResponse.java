package com.onfis.project.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String fileName,
        String fileUrl,
        String fileType,
        Integer size,
        UUID uploadedBy,
        String uploadedByName,
        LocalDateTime createdAt
) {
}
