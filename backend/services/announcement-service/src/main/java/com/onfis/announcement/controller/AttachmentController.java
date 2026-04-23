package com.onfis.announcement.controller;

import com.onfis.announcement.entity.Attachment;
import com.onfis.announcement.dto.AttachmentResponseDTO;
import com.onfis.announcement.repository.AttachmentRepository;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    private final AttachmentRepository attachmentRepository;

    @GetMapping("/{id}")
    public ResponseEntity<AttachmentResponseDTO> getAttachmentById(@PathVariable("id") UUID id) {
        Attachment attachment = attachmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy file"));

        AttachmentResponseDTO dto = AttachmentResponseDTO.builder()
            .id(attachment.getId())
            .fileName(attachment.getName())
            .url(attachment.getFileUrl())
            .size(attachment.getSize())
            .build();
        
        return ResponseEntity.ok(dto);
    }
}