package com.onfis.project.controller;

import com.onfis.project.dto.AttachmentResponse;
import com.onfis.project.service.AttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
public class AttachmentController {

    private static final String USER_HEADER = "X-User-ID";

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    // ── Task Reference Files ──────────────────────────────────────────────────

    @PostMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadTaskAttachment(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.uploadTaskAttachment(userId, taskId, file));
    }

    @GetMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getTaskAttachments(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(attachmentService.getTaskAttachments(userId, taskId));
    }

    // ── Task Submission Files ─────────────────────────────────────────────────

    @PostMapping("/tasks/{taskId}/submissions")
    public ResponseEntity<AttachmentResponse> uploadTaskSubmission(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.uploadTaskSubmission(userId, taskId, file));
    }

    @GetMapping("/tasks/{taskId}/submissions")
    public ResponseEntity<List<AttachmentResponse>> getTaskSubmissions(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(attachmentService.getTaskSubmissions(userId, taskId));
    }

    // ── Project Files ─────────────────────────────────────────────────────────

    @PostMapping("/{projectId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadProjectAttachment(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.uploadProjectAttachment(userId, projectId, file));
    }

    @GetMapping("/{projectId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getProjectAttachments(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(attachmentService.getProjectAttachments(userId, projectId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @RequestHeader(USER_HEADER) String userId,
            @PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(userId, attachmentId);
        return ResponseEntity.noContent().build();
    }
}
