package com.onfis.announcement.service;

import com.onfis.announcement.client.UserClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.announcement.client.ChatNotificationClient;
import com.onfis.announcement.client.PositionClient;
import com.onfis.announcement.dto.*;
import com.onfis.announcement.entity.*;
import com.onfis.announcement.repository.*;

import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.core.type.TypeReference;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {
    private final AnnouncementRepository announcementRepository;
    private final AttachmentRepository attachmentRepository;
    private final AnnouncementCommentRepository commentRepository;
    private final AnnouncementLikeRepository likeRepository;
    private final AnnouncementCommentLikeRepository commentLikeRepository;
    
    private final UserClient userClient;
    private final PositionClient positionClient;
    private final ChatNotificationClient chatNotificationClient;
    private final ObjectMapper objectMapper;
    private final SupabaseStorageService supabaseStorageService;

    private AnnouncementDTO convertToDTO(String token, String companyIdStr, Announcement ann, UUID currentUserId) {
        return convertToDTOWithCache(token, companyIdStr, ann, currentUserId, new HashMap<>(), new HashMap<>());
    }

    private AnnouncementDTO convertToDTOWithCache(String token, String companyIdStr, Announcement ann, UUID currentUserId,
                                                  Map<UUID, UserResponseDTO> userCache,
                                                  Map<UUID, PositionResponseDTO> posCache) {
        
        AnnouncementDTO dto = AnnouncementDTO.builder()
                .id(ann.getId())
                .title(ann.getTitle())
                .content(ann.getContent())
                .isPinned(ann.isPinned())
                .createdAt(ann.getCreatedAt())
                .scope(ann.getTargetDepartmentId() == null ? "company" : "department")
                .authId(ann.getAuthorId())
                .targetDepartmentId(ann.getTargetDepartmentId())
                .build();
        
        UUID tenantId = UUID.fromString(companyIdStr);
        
        dto.setNumberOfComments(commentRepository.countByTenantIdAndAnnouncementId(tenantId, ann.getId()));
        dto.setNumberOfLike(likeRepository.countByTenantIdAndAnnouncementId(tenantId, ann.getId()));
        if (currentUserId != null) {
            dto.setInitialIsLike(likeRepository.existsByTenantIdAndAnnouncementIdAndUserId(tenantId, ann.getId(), currentUserId));
        }

        List<Attachment> attachments = attachmentRepository.findByTenantIdAndAnnouncementId(tenantId, ann.getId());
        dto.setAttachments(attachments.stream().map(a -> AttachmentResponseDTO.builder()
                .id(a.getId())
                .fileName(a.getName())
                .url(a.getFileUrl())
                .size(a.getSize())
                .build()).toList());

        try {
            UUID authorId = ann.getAuthorId();
            
            // 🌟 SỬA LỖI 1: Dùng containsKey thay cho computeIfAbsent để ép Java lưu cả giá trị NULL (Tránh thủng Cache)
            if (!userCache.containsKey(authorId)) {
                try {
                    userCache.put(authorId, userClient.getUserProfile(token, companyIdStr, authorId));
                } catch (Exception e) {
                    userCache.put(authorId, null); 
                }
            }
            UserResponseDTO author = userCache.get(authorId);

            if (author != null) {
                String fName = author.getFirstName() != null ? author.getFirstName() : "";
                String lName = author.getLastName() != null ? author.getLastName() : "";
                String fullName = (fName + " " + lName).trim();
                
                dto.setAuthName(fullName.isEmpty() ? "Unknown User" : fullName);
                dto.setAvatarUrl(author.getAvatarUrl());
                dto.setEmail(author.getEmail());

                if (author.getPositionId() != null) {
                    UUID posId = author.getPositionId();
                    
                    if (!posCache.containsKey(posId)) {
                        try {
                            posCache.put(posId, positionClient.getPositionById(token, companyIdStr, posId));
                        } catch (Exception e) {
                            posCache.put(posId, null);
                        }
                    }
                    PositionResponseDTO position = posCache.get(posId);

                    if (position != null) {
                        dto.setAuthDepartment(position.getDepartmentName());
                        if (ann.getTargetDepartmentId() != null) {
                            dto.setTargetDepartmentName(position.getDepartmentName());
                        }
                    }
                }
            } else {
                dto.setAuthName("Unknown User");
            }
        } catch (Exception e) {
            log.error("Lỗi nội bộ khi map User {} : {}", ann.getAuthorId(), e.getMessage());
            dto.setAuthName("Unknown User");
        }
        
        return dto;
    }

    public Page<AnnouncementDTO> getAllAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        if (companyIdStr == null || companyIdStr.isBlank()) return Page.empty();
        UUID tenantId = UUID.fromString(companyIdStr);
        
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndStatus(tenantId, "PUBLISHED", pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public Page<AnnouncementDTO> getPinnedAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        UUID tenantId = UUID.fromString(companyIdStr);
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndIsPinnedTrueAndStatus(tenantId, "PUBLISHED", pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public Page<AnnouncementDTO> getCompanyAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        UUID tenantId = UUID.fromString(companyIdStr);
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndTargetDepartmentIdIsNullAndStatus(tenantId, "PUBLISHED", pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public Page<AnnouncementDTO> getCurrentUserDepartmentAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        try {
            UUID tenantId = UUID.fromString(companyIdStr);
            
            UserResponseDTO myProfile = userClient.getUserProfile(token, companyIdStr, currentUserId);
            if (myProfile == null || myProfile.getPositionId() == null) {
                return Page.empty();
            }

            PositionResponseDTO positionDetails = positionClient.getPositionById(token, companyIdStr, myProfile.getPositionId());
            if (positionDetails == null || positionDetails.getDepartmentId() == null) {
                return Page.empty(); 
            }
            
            UUID myDepartmentId = positionDetails.getDepartmentId();
            
            Map<UUID, UserResponseDTO> userCache = new HashMap<>();
            Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
            
            return announcementRepository.findByTenantIdAndTargetDepartmentIdAndStatus(tenantId, myDepartmentId, "PUBLISHED", pageable)
                    .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
                    
        } catch (Exception e) {
            log.error("Lỗi khi lấy thông báo phòng ban cho user {}: {}", currentUserId, e.getMessage());
            return Page.empty(); // Trả về danh sách rỗng thay vì ném lỗi 500 cho Frontend
        }
    }

    public AnnouncementDetailDTO getAnnouncementById(String token, String companyIdStr, UUID id, UUID currentUserId) {
        UUID tenantId = UUID.fromString(companyIdStr);
        Announcement ann = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài thông báo với ID: " + id));

        AnnouncementDTO basicDTO = convertToDTO(token, companyIdStr, ann, currentUserId);
        
        AnnouncementDetailDTO detailDTO = AnnouncementDetailDTO.builder()
                .id(basicDTO.getId())
                .title(basicDTO.getTitle())
                .content(basicDTO.getContent())
                .isPinned(basicDTO.isPinned())
                .createdAt(basicDTO.getCreatedAt())
                .scope(basicDTO.getScope())
                .targetDepartmentId(basicDTO.getTargetDepartmentId())
                .authId(basicDTO.getAuthId())
                .authName(basicDTO.getAuthName())
                .authDepartment(basicDTO.getAuthDepartment())
                .avatarUrl(basicDTO.getAvatarUrl())
                .email(basicDTO.getEmail())
                .build();

        List<Attachment> attachments = attachmentRepository.findByTenantIdAndAnnouncementId(tenantId, id);
        detailDTO.setAttachments(attachments.stream().map(a -> AttachmentResponseDTO.builder()
                .id(a.getId()).fileName(a.getName()).url(a.getFileUrl()).size(a.getSize()).build()).toList());

        List<AnnouncementLike> likes = likeRepository.findByTenantIdAndAnnouncementId(tenantId, id);
        detailDTO.setLikes(likes.stream().map(AnnouncementLike::getUserId).toList());
        if (currentUserId != null) {
            detailDTO.setInitialIsLike(likeRepository.existsByTenantIdAndAnnouncementIdAndUserId(tenantId, id, currentUserId));
        }

        List<AnnouncementComment> comments = commentRepository.findByTenantIdAndAnnouncementIdOrderByCreatedAtAsc(tenantId, id);
        
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        for (AnnouncementComment c : comments) {
            if (!userCache.containsKey(c.getUserId())) {
                try {
                    userCache.put(c.getUserId(), userClient.getUserProfile(token, companyIdStr, c.getUserId()));
                } catch (Exception e) {
                    userCache.put(c.getUserId(), null);
                }
            }
        }

        Map<UUID, AnnouncementCommentResponseDTO> dtoMap = new java.util.LinkedHashMap<>();
        for (AnnouncementComment c : comments) {
            UserResponseDTO cAuthor = userCache.get(c.getUserId());
            
            String cName = "Unknown User";
            String cAvatar = null;
            if (cAuthor != null) {
                String fName = cAuthor.getFirstName() != null ? cAuthor.getFirstName() : "";
                String lName = cAuthor.getLastName() != null ? cAuthor.getLastName() : "";
                String fullName = (fName + " " + lName).trim();
                cName = fullName.isEmpty() ? "Unknown User" : fullName;
                cAvatar = cAuthor.getAvatarUrl();
            }

            List<UUID> commentLikes = commentLikeRepository.findByTenantIdAndCommentId(tenantId, c.getId())
                    .stream().map(AnnouncementCommentLike::getUserId).toList();

            AnnouncementCommentResponseDTO dto = AnnouncementCommentResponseDTO.builder()
                    .id(c.getId())
                    .userId(c.getUserId())
                    .name(cName)
                    .avatarUrl(cAvatar)
                    .content(c.getContent())
                    .date(c.getCreatedAt())
                    .announcementId(c.getAnnouncementId())
                    .likes(commentLikes) 
                    .replies(new java.util.ArrayList<>())
                    .build();
            dtoMap.put(c.getId(), dto);
        }

        List<AnnouncementCommentResponseDTO> rootComments = new java.util.ArrayList<>();
        for (AnnouncementComment c : comments) {
            AnnouncementCommentResponseDTO dto = dtoMap.get(c.getId());
            if (c.getParentId() == null) {
                rootComments.add(dto);
            } else {
                AnnouncementCommentResponseDTO parentDto = dtoMap.get(c.getParentId());
                if (parentDto != null) {
                    parentDto.getReplies().add(dto);
                }
            }
        }
        
        detailDTO.setComments(rootComments);
        return detailDTO;
    }

    public List<DepartmentDTO> getMyPostingDepartments(String token, String companyIdStr, UUID userId) {
        try {
            UserResponseDTO myProfile = userClient.getUserProfile(token, companyIdStr, userId);
            if (myProfile != null && myProfile.getPositionId() != null) {
                PositionResponseDTO position = positionClient.getPositionById(token, companyIdStr, myProfile.getPositionId());
                if (position != null && position.getDepartmentId() != null) {
                    return List.of(new DepartmentDTO(position.getDepartmentId(), position.getDepartmentName()));
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi lấy phòng ban của user {}: {}", userId, e.getMessage());
        }
        return List.of(); 
    }

    public AnnouncementCommentResponseDTO addComment(String token, String companyIdStr, UUID announcementId, UUID userId, AnnouncementCommentRequestDTO request) {
        UUID tenantId = UUID.fromString(companyIdStr);

        AnnouncementComment comment = AnnouncementComment.builder()
                .tenantId(tenantId)
                .announcementId(announcementId)
                .userId(userId)
                .content(request.getContent())
                .parentId(request.getParentId()) 
                .build();
        comment = commentRepository.save(comment);

        String authorName = "Unknown User";
        String avatarUrl = null;
        try {
            UserResponseDTO author = userClient.getUserProfile(token, companyIdStr, userId);
            if (author != null) {
                String fName = author.getFirstName() != null ? author.getFirstName() : "";
                String lName = author.getLastName() != null ? author.getLastName() : "";
                String fullName = (fName + " " + lName).trim();
                authorName = fullName.isEmpty() ? "Unknown User" : fullName;
                avatarUrl = author.getAvatarUrl();
            }
        } catch (Exception e) {
            log.warn("Không lấy được thông tin user khi comment: {}", e.getMessage());
        }

        return AnnouncementCommentResponseDTO.builder()
                .id(comment.getId())
                .userId(comment.getUserId())
                .announcementId(comment.getAnnouncementId())
                .content(comment.getContent())
                .date(comment.getCreatedAt())
                .name(authorName)
                .avatarUrl(avatarUrl)
                .likes(new java.util.ArrayList<>())
                .replies(new java.util.ArrayList<>())
                .build();
    }

    @Transactional
    public boolean toggleAnnouncementLike(String companyIdStr, UUID announcementId, UUID userId) {
        UUID tenantId = UUID.fromString(companyIdStr);
        if (likeRepository.existsByTenantIdAndAnnouncementIdAndUserId(tenantId, announcementId, userId)) {
            likeRepository.deleteByTenantIdAndAnnouncementIdAndUserId(tenantId, announcementId, userId);
            return false;
        } else {
            likeRepository.save(AnnouncementLike.builder().tenantId(tenantId).announcementId(announcementId).userId(userId).build());
            return true;
        }
    }

    @Transactional
    public boolean toggleCommentLike(String companyIdStr, UUID commentId, UUID userId) {
        UUID tenantId = UUID.fromString(companyIdStr);
        if (commentLikeRepository.existsByTenantIdAndCommentIdAndUserId(tenantId, commentId, userId)) {
            commentLikeRepository.deleteByTenantIdAndCommentIdAndUserId(tenantId, commentId, userId);
            return false;
        } else {
            commentLikeRepository.save(AnnouncementCommentLike.builder().tenantId(tenantId).commentId(commentId).userId(userId).build());
            return true;
        }
    }

    @Transactional
    public AnnouncementDTO createAnnouncement(String token, String companyIdStr, UUID authorId, AnnouncementCreateRequestDTO request) {
        UUID tenantId = UUID.fromString(companyIdStr);
        UUID targetDeptId = null;

        if ("department".equalsIgnoreCase(request.getScope()) && request.getDepartments() != null) {
            try {
                List<String> deptIds = objectMapper.readValue(request.getDepartments(), new TypeReference<List<String>>() {});
                if (!deptIds.isEmpty()) targetDeptId = UUID.fromString(deptIds.get(0));
            } catch (Exception e) { log.error("Lỗi parse JSON"); }
        }

        Announcement announcement;
        if (request.getId() != null) {
            announcement = announcementRepository.findById(request.getId())
                    .orElse(new Announcement());
        } else {
            announcement = new Announcement();
            announcement.setTenantId(tenantId);
            announcement.setAuthorId(authorId);
        }

        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setPinned(request.getIsPinned() != null ? request.getIsPinned() : false);
        announcement.setTargetDepartmentId(targetDeptId);
        announcement.setStatus(request.getStatus().toUpperCase());

        announcement = announcementRepository.save(announcement);

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (MultipartFile file : request.getAttachments()) {
                String actualFileUrl = supabaseStorageService.uploadFile(file);

                Attachment attachment = Attachment.builder()
                        .tenantId(tenantId)
                        .announcementId(announcement.getId())
                        .name(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .size((int) file.getSize())
                        .fileUrl(actualFileUrl) 
                        .uploadedBy(authorId)
                        .build();
                attachmentRepository.save(attachment);
            }
        }

        // return convertToDTO(token, companyIdStr, announcement, authorId);

        AnnouncementDTO finalDto = convertToDTO(token, companyIdStr, announcement, authorId);
        try {
            chatNotificationClient.sendAnnouncementNotification(token, companyIdStr, finalDto);
        } catch (Exception e) {
            log.warn("Không thể bắn notification cho announcement mới: {}", e.getMessage());
        }
        return finalDto;
    }

    public AnnouncementDetailDTO getMyLatestDraft(String token, String companyIdStr, UUID userId) {
        UUID tenantId = UUID.fromString(companyIdStr);
        Optional<Announcement> draftOpt = announcementRepository.findFirstByTenantIdAndAuthorIdAndStatusOrderByCreatedAtDesc(tenantId, userId, "DRAFT");
        
        if (draftOpt.isPresent()) {
            return getAnnouncementById(token, companyIdStr, draftOpt.get().getId(), userId);
        }
        return null; // Không có nháp
    }

    public Page<AnnouncementDTO> searchAnnouncements(String token, String companyIdStr, String keyword, UUID currentUserId, Pageable pageable) {
        if (companyIdStr == null || companyIdStr.isBlank() || keyword == null || keyword.trim().isEmpty()) {
            return Page.empty();
        }
        
        UUID tenantId = UUID.fromString(companyIdStr);
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndTitleContainingIgnoreCaseAndStatus(tenantId, keyword.trim(), "PUBLISHED", pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public AttachmentResponseDTO uploadStandaloneFile(String companyIdStr, UUID uploaderId, MultipartFile file) {
        UUID tenantId = UUID.fromString(companyIdStr);
        String actualFileUrl = supabaseStorageService.uploadFile(file);

        Attachment attachment = Attachment.builder()
                .tenantId(tenantId)
                // Không set announcementId vì file này dùng cho chat
                .name(file.getOriginalFilename())
                .fileType(file.getContentType())
                .size((int) file.getSize())
                .fileUrl(actualFileUrl)
                .uploadedBy(uploaderId)
                .build();

        attachment = attachmentRepository.save(attachment);

        return AttachmentResponseDTO.builder()
                .id(attachment.getId())
                .fileName(attachment.getName())
                .url(attachment.getFileUrl())
                .size(attachment.getSize())
                .build();
    }

    public AttachmentResponseDTO getAttachmentById(UUID id) {
        Attachment a = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file"));
        return AttachmentResponseDTO.builder()
                .id(a.getId())
                .fileName(a.getName())
                .url(a.getFileUrl())
                .size(a.getSize())
                .build();
    }

    @Transactional
    public boolean toggleAnnouncementPin(String token, String companyIdStr, UUID announcementId, UUID userId) {
        UUID tenantId = UUID.fromString(companyIdStr);

        // 1. Tìm bài thông báo trong database
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài thông báo với ID: " + announcementId));

        // Thêm bước kiểm tra tenantId
        if (!announcement.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Bài viết không thuộc quyền quản lý của công ty bạn!");
        }

        // 2. Lấy thông tin Profile và Vị trí của người dùng hiện tại để check quyền
        UserResponseDTO myProfile = userClient.getUserProfile(token, companyIdStr, userId);
        if (myProfile == null) {
            throw new RuntimeException("Không tìm thấy thông tin người dùng.");
        }

        // LƯU Ý: Bạn hãy kiểm tra tên trường Role trong UserResponseDTO của bạn (ví dụ: getRole(), getRoleName()...)
        String role = myProfile.getRole(); 

        if ("ADMIN".equalsIgnoreCase(role)) {
            // Admin có quyền ghim/bỏ ghim mọi bài viết trong hệ thống
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            // Manager chỉ được phép ghim bài nếu bài đó thuộc về phòng ban của họ
            if (myProfile.getPositionId() == null) {
                throw new RuntimeException("Manager chưa được gán vị trí công việc.");
            }

            // Gọi PositionClient để lấy DepartmentId của Manager
            PositionResponseDTO position = positionClient.getPositionById(token, companyIdStr, myProfile.getPositionId());
            UUID managerDeptId = position.getDepartmentId();

            // Kiểm tra: Nếu bài viết là Global (targetDepartmentId == null) hoặc thuộc phòng ban khác
            if (announcement.getTargetDepartmentId() == null || !announcement.getTargetDepartmentId().equals(managerDeptId)) {
                throw new RuntimeException("Manager chỉ có quyền ghim các thông báo thuộc về phòng ban của mình.");
            }
        } else {
            // Các vai trò khác (như Employee) không có quyền ghim
            throw new RuntimeException("Bạn không có quyền thực hiện chức năng này.");
        }

        // 3. Đảo ngược trạng thái Pin hiện tại
        boolean newPinStatus = !announcement.isPinned();
        announcement.setPinned(newPinStatus);

        // 4. Lưu lại cập nhật vào Database
        announcementRepository.save(announcement);

        return newPinStatus;
    }
}