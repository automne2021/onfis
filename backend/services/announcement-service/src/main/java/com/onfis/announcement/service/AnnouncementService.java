package com.onfis.announcement.service;

import com.onfis.announcement.client.UserClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onfis.announcement.client.PositionClient;
import com.onfis.announcement.dto.*;
import com.onfis.announcement.entity.*;
import com.onfis.announcement.repository.*;

import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
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
    
    // 🌟 SỬA LỖI 2: Inject ObjectMapper có sẵn của Spring Boot để dùng chung
    private final ObjectMapper objectMapper;

    // (Đã xóa hàm getTenantId() và TenantContext vì không cần thiết nữa)

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

    // 🌟 SỬA LỖI 3: Đồng nhất UUID tenantId = UUID.fromString(companyIdStr);
    public Page<AnnouncementDTO> getAllAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        if (companyIdStr == null || companyIdStr.isBlank()) return Page.empty();
        UUID tenantId = UUID.fromString(companyIdStr);
        
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantId(tenantId, pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public Page<AnnouncementDTO> getPinnedAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        UUID tenantId = UUID.fromString(companyIdStr);
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndIsPinnedTrue(tenantId, pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public Page<AnnouncementDTO> getCompanyAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        UUID tenantId = UUID.fromString(companyIdStr);
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndTargetDepartmentIdIsNull(tenantId, pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
    }

    public Page<AnnouncementDTO> getCurrentUserDepartmentAnnouncements(String token, String companyIdStr, UUID currentUserId, Pageable pageable) {
        UUID tenantId = UUID.fromString(companyIdStr);
        UserResponseDTO myProfile = userClient.getUserProfile(token, companyIdStr, currentUserId);
        UUID myPositionId = myProfile.getPositionId();

        if (myPositionId == null) return Page.empty();

        PositionResponseDTO positionDetails = positionClient.getPositionById(token, companyIdStr, myPositionId);
        UUID myDepartmentId = positionDetails.getDepartmentId();
        
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();
        Map<UUID, PositionResponseDTO> posCache = new HashMap<>();
        
        return announcementRepository.findByTenantIdAndTargetDepartmentId(tenantId, myDepartmentId, pageable)
                .map(ann -> convertToDTOWithCache(token, companyIdStr, ann, currentUserId, userCache, posCache));
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

        if ("department".equalsIgnoreCase(request.getScope())) {
            try {
                String deptsJson = request.getDepartments();
                if (deptsJson != null && !deptsJson.isBlank() && !deptsJson.equals("[]")) {
                    
                    // 🌟 KHÔNG new ObjectMapper() nữa, dùng biến được Inject ở trên
                    List<String> deptIds = objectMapper.readValue(deptsJson, new TypeReference<List<String>>() {});
                    if (!deptIds.isEmpty()) {
                        targetDeptId = UUID.fromString(deptIds.get(0));
                    }
                }
            } catch (Exception e) {
                log.error("Lỗi parse chuỗi JSON departments: {}", e.getMessage());
            }
        }

        Announcement announcement = Announcement.builder()
                .tenantId(tenantId)
                .authorId(authorId)
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : false)
                .targetDepartmentId(targetDeptId)
                .build();
        
        announcement = announcementRepository.save(announcement);

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (MultipartFile file : request.getAttachments()) {
                String mockFileUrl = "https://onfis-storage.local/files/" + file.getOriginalFilename();
                Attachment attachment = Attachment.builder()
                        .tenantId(tenantId)
                        .announcementId(announcement.getId())
                        .name(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .size((int) file.getSize())
                        .fileUrl(mockFileUrl)
                        .uploadedBy(authorId)
                        .build();
                attachmentRepository.save(attachment);
            }
        }

        return convertToDTO(token, companyIdStr, announcement, authorId);
    }
}