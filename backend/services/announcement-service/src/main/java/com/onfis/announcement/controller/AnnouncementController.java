package com.onfis.announcement.controller;

import com.onfis.announcement.dto.AnnouncementCommentRequestDTO;
import com.onfis.announcement.dto.AnnouncementCommentResponseDTO;
import com.onfis.announcement.dto.AnnouncementCreateRequestDTO;
import com.onfis.announcement.dto.AnnouncementDTO;
import com.onfis.announcement.dto.AnnouncementDetailDTO;
import com.onfis.announcement.dto.AttachmentResponseDTO;
import com.onfis.announcement.dto.DepartmentDTO;
import com.onfis.announcement.service.AnnouncementService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/announcements")
public class AnnouncementController {

  private final AnnouncementService announcementService;

  public AnnouncementController(AnnouncementService announcementService) {
    this.announcementService = announcementService;
  }

  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health(
      @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
    Map<String, String> response = new HashMap<>();
    response.put("service", "announcement-service");
    response.put("status", "UP");
    response.put("port", "8086");
    if (companyId != null) response.put("companyId", companyId);
    return ResponseEntity.ok(response);
  }


  @GetMapping("/all")
  public ResponseEntity<Page<AnnouncementDTO>> getAll(
      @RequestHeader("Authorization") String token,
      @RequestHeader(value = "X-Company-ID", required = false) String companyId,
      @RequestHeader(value = "X-User-ID", required = false) UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<AnnouncementDTO> list = announcementService.getAllAnnouncements(token, companyId, userId, pageable);
    return ResponseEntity.ok(list);
  }

  @GetMapping("/pinned")
  public ResponseEntity<Page<AnnouncementDTO>> getPinned(
          @RequestHeader("Authorization") String token,
          @RequestHeader(value = "X-Company-ID", required = false) String companyId,
          @RequestHeader(value = "X-User-ID", required = false) UUID userId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
      
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
      return ResponseEntity.ok(announcementService.getPinnedAnnouncements(token, companyId, userId, pageable));
  }

  @GetMapping("/company")
  public ResponseEntity<Page<AnnouncementDTO>> getCompany(
          @RequestHeader("Authorization") String token,
          @RequestHeader(value = "X-Company-ID", required = false) String companyId,
          @RequestHeader(value = "X-User-ID", required = false) UUID userId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
      
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
      return ResponseEntity.ok(announcementService.getCompanyAnnouncements(token, companyId, userId, pageable));
  }

  @GetMapping("/department")
  public ResponseEntity<Page<AnnouncementDTO>> getDepartment(
          @RequestHeader("Authorization") String token,
          @RequestHeader(value = "X-Company-ID", required = false) String companyId,
          @RequestHeader(value = "X-User-ID", required = false) UUID userId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
      
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
      return ResponseEntity.ok(announcementService.getCurrentUserDepartmentAnnouncements(token, companyId, userId, pageable));
  }

  /* ==================================================================== */

  @GetMapping("/detail/{id}")
  public ResponseEntity<AnnouncementDetailDTO> getById(
          @RequestHeader("Authorization") String token,
          @RequestHeader(value = "X-Company-ID", required = false) String companyId,
          @RequestHeader(value = "X-User-ID", required = false) UUID userId,
          @PathVariable("id") UUID id) {
      
      log.info("📥 [CONTROLLER] API /detail/{id} được gọi. ID: {}", id);
      return ResponseEntity.ok(announcementService.getAnnouncementById(token, companyId, id, userId));
  }

  @GetMapping("/my-departments")
public ResponseEntity<List<DepartmentDTO>> getMyDepartments(
        @RequestHeader("Authorization") String token,
        @RequestHeader("X-Company-ID") String companyId,
        @RequestHeader("X-User-ID") UUID userId) {
    
    return ResponseEntity.ok(announcementService.getMyPostingDepartments(token, companyId, userId));
}

  @GetMapping("/search")
  public ResponseEntity<Page<AnnouncementDTO>> searchAnnouncements(
          @RequestHeader("Authorization") String token,
          @RequestHeader(value = "X-Company-ID", required = false) String companyId,
          @RequestHeader(value = "X-User-ID", required = false) UUID userId,
          @RequestParam("keyword") String keyword,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size) {
      
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
      return ResponseEntity.ok(announcementService.searchAnnouncements(token, companyId, keyword, userId, pageable));
  }

  @GetMapping("/draft")
  public ResponseEntity<AnnouncementDetailDTO> getMyDraft(
          @RequestHeader("Authorization") String token,
          @RequestHeader("X-Company-ID") String companyId,
          @RequestHeader("X-User-ID") UUID userId) {
      
      AnnouncementDetailDTO draft = announcementService.getMyLatestDraft(token, companyId, userId);
      return draft != null ? ResponseEntity.ok(draft) : ResponseEntity.noContent().build();
  }

  @GetMapping("/attachments/{id}")
  public ResponseEntity<AttachmentResponseDTO> getAttachmentById(@PathVariable("id") UUID id) {
      // Gọi qua service để lấy
      return ResponseEntity.ok(announcementService.getAttachmentById(id));
  }

  /* ================== POST ================== */

  @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AnnouncementDTO> createAnnouncement(
          @RequestHeader("Authorization") String token,
          @RequestHeader("X-Company-ID") String companyIdStr,
          @RequestHeader(value = "X-User-ID", required = false) UUID userId,
          @ModelAttribute AnnouncementCreateRequestDTO request) {
      
      log.info("📥 Nhận yêu cầu tạo bài đăng mới từ User: {}", userId);
      AnnouncementDTO newAnnouncement = announcementService.createAnnouncement(token, companyIdStr, userId, request);
      return ResponseEntity.ok(newAnnouncement);
  }

  @PostMapping("/{id}/comments")
  public ResponseEntity<AnnouncementCommentResponseDTO> addComment(
          @RequestHeader("Authorization") String token,
          @RequestHeader(value = "X-Company-ID") String companyId,
          @RequestHeader("X-User-ID") UUID userId,
          @PathVariable("id") UUID announcementId,
          @RequestBody AnnouncementCommentRequestDTO request) {
      
      log.info("📥 [CONTROLLER] Nhận bình luận mới cho bài viết ID: {}", announcementId);
      AnnouncementCommentResponseDTO newComment = announcementService.addComment(token, companyId, announcementId, userId, request);
      return ResponseEntity.ok(newComment);
  }

  @PostMapping("/{id}/like")
  public ResponseEntity<Boolean> toggleAnnouncementLike(
          @RequestHeader("X-Company-ID") String companyId,
          @RequestHeader("X-User-ID") UUID userId,
          @PathVariable("id") UUID announcementId) {
      boolean isLiked = announcementService.toggleAnnouncementLike(companyId, announcementId, userId);
      return ResponseEntity.ok(isLiked);
  }

  @PostMapping("/comments/{commentId}/like")
  public ResponseEntity<Boolean> toggleCommentLike(
          @RequestHeader("X-Company-ID") String companyId,
          @RequestHeader("X-User-ID") UUID userId,
          @PathVariable("commentId") UUID commentId) {
      boolean isLiked = announcementService.toggleCommentLike(companyId, commentId, userId);
      return ResponseEntity.ok(isLiked);
  }

  @PostMapping(value = "/attachments/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponseDTO> uploadStandaloneFile(
            @RequestHeader("X-Company-ID") String companyIdStr,
            @RequestHeader(value = "X-User-ID", required = false) UUID userId,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(announcementService.uploadStandaloneFile(companyIdStr, userId, file));
    }

  @PostMapping("/{id}/toggle-pin")
  public ResponseEntity<Boolean> toggleAnnouncementPin(
          @RequestHeader("Authorization") String token,
          @RequestHeader("X-Company-ID") String companyId,
          @RequestHeader("X-User-ID") UUID userId,
          @PathVariable("id") UUID announcementId) {
      
      log.info("📥 [CONTROLLER] User {} đang thực hiện ghim/bỏ ghim bài viết ID: {}", userId, announcementId);
      // Gọi qua service để xử lý logic và trả về trạng thái is_pinned mới nhất (true/false)
      boolean isPinned = announcementService.toggleAnnouncementPin(token, companyId, announcementId, userId);
      return ResponseEntity.ok(isPinned);
  }
}