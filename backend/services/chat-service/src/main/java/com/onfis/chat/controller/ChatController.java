package com.onfis.chat.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.onfis.chat.client.UserClient;
import com.onfis.chat.dto.ChatMessageResponseDTO;
import com.onfis.chat.dto.ConversationResponseDTO;
import com.onfis.chat.dto.UserResponseDTO;
import com.onfis.chat.entity.ChatMessage;
import com.onfis.chat.entity.Conversation;
import com.onfis.chat.entity.ConversationMember;
import com.onfis.chat.repository.ChatMessageRepository;
import com.onfis.chat.repository.ConversationMemberRepository;
import com.onfis.chat.repository.ConversationRepository;
import com.onfis.chat.service.PresenceService;
import com.onfis.chat.dto.CreateConversationRequestDTO;
import com.onfis.chat.client.AttachmentClient;
import com.onfis.chat.dto.AttachmentResponseDTO;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor 
public class ChatController {
    
    private final ChatMessageRepository messageRepository;
    private final ConversationMemberRepository memberRepository;
    private final ConversationRepository conversationRepository;
    private final UserClient userClient;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AttachmentClient attachmentClient;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health(
        @RequestHeader(value = "X-Company-ID", required = false) String companyId) {
        Map<String, String> response = new HashMap<>();
        response.put("service", "chat-service");
        response.put("status", "UP");
        response.put("port", "8085");
        if (companyId != null) response.put("companyId", companyId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponseDTO>> getUserConversations(
            @RequestHeader("Authorization") String token,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) { 
        
        List<ConversationMember> memberships = memberRepository.findByUserId(userId);
        List<UUID> conversationIds = memberships.stream()
                .map(ConversationMember::getConversationId)
                .collect(Collectors.toList());

        List<Conversation> conversations = new java.util.ArrayList<>(conversationRepository.findAllById(conversationIds));

        UUID tempTenantId = null;
        if (companyIdStr != null && !companyIdStr.isEmpty()) {
            try { tempTenantId = UUID.fromString(companyIdStr); } catch (Exception ignored) {}
        }
        
        UserResponseDTO userInfo = null;
        try {
            userInfo = userClient.getUserProfile(token, companyIdStr, userId);
            if (tempTenantId == null && userInfo != null && userInfo.tenantId() != null) {
                tempTenantId = userInfo.tenantId();
            }
        } catch (Exception e) {
            log.warn("Không thể lấy thông tin user: {}", e.getMessage());
        }

        if (tempTenantId == null) {
            log.error("Lỗi: Không tìm thấy Tenant ID hợp lệ!");
            return ResponseEntity.ok(conversations.stream()
                .map(conv -> mapToResponseDTO(conv, userId, token, companyIdStr)) // Dùng hàm Overload
                .collect(Collectors.toList()));
        }

        final UUID finalTenantId = tempTenantId;
        final String userAuthToken = token;
        final String finalCompanyIdStr = companyIdStr;

        int companyUserCount = 0;
        try {
            companyUserCount = userClient.countUsersInCompany(token, finalCompanyIdStr);
        } catch (Exception e) {
            log.warn("Không lấy được tổng số user từ User Service: {}", e.getMessage());
        }
        final int finalTotalUsers = companyUserCount;
        
        List<Conversation> publicGroups = conversationRepository.findByTenantIdAndType(finalTenantId, "public_group");
        for (Conversation pubGroup : publicGroups) {
            if (conversations.stream().noneMatch(c -> c.getId().equals(pubGroup.getId()))) {
                conversations.add(pubGroup);
            }
        }

        // Khởi tạo Saved Messages (Self Chat)
        boolean hasSelfChat = conversations.stream()
                .anyMatch(c -> "self".equalsIgnoreCase(c.getType()));

        if (!hasSelfChat) {
            String defaultName = formatFullName(userInfo, "Saved Messages") + " (You)";

            Conversation selfChat = conversationRepository.save(Conversation.builder()
                    .tenantId(finalTenantId)
                    .type("self")
                    .name(defaultName)
                    .build());

            memberRepository.save(ConversationMember.builder()
                    .conversationId(selfChat.getId())
                    .userId(userId)
                    .role("ADMIN")
                    .joinedAt(ZonedDateTime.now())
                    .readAt(ZonedDateTime.now())
                    .build());
            conversations.add(selfChat);
        }

        String randomName = "random";
        Conversation randomChannel = conversationRepository.findFirstByTenantIdAndName(finalTenantId, randomName)
            .orElseGet(() -> conversationRepository.save(Conversation.builder()
                    .tenantId(finalTenantId)
                    .type("public_group") 
                    .name(randomName)
                    .build()));

        if (conversations.stream().noneMatch(c -> c.getId().equals(randomChannel.getId()))) {
            memberRepository.save(ConversationMember.builder()
                    .conversationId(randomChannel.getId())
                    .userId(userId)
                    .role("MEMBER")
                    .joinedAt(ZonedDateTime.now())
                    .readAt(ZonedDateTime.now())
                    .build());
            conversations.add(randomChannel);

            // Fix lỗi "null null joined the channel"
            String userName = formatFullName(userInfo, "A new user");
            messageRepository.save(ChatMessage.builder()
                    .conversationId(randomChannel.getId())
                    .userId(userId) 
                    .content(userName + " joined the channel.")
                    .type("system")
                    .isEdited(false)
                    .build());
        }

        List<ConversationResponseDTO> responseList = conversations.stream()
            .map(conv -> mapToResponseDTO(conv, userId, userAuthToken, finalCompanyIdStr, finalTotalUsers))
            .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable UUID conversationId,
            @RequestHeader("Authorization") String token, 
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) { 
        
        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isMember = memberRepository.existsByConversationIdAndUserId(conversationId, userId);
        boolean isPublic = "public_group".equalsIgnoreCase(conv.getType());

        if (!isMember) {
            if (isPublic) {
                memberRepository.save(ConversationMember.builder()
                        .conversationId(conversationId)
                        .userId(userId)
                        .role("MEMBER")
                        .joinedAt(java.time.ZonedDateTime.now())
                        .readAt(java.time.ZonedDateTime.now())
                        .build());
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền truy cập");
            }
        }
        
        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        Map<UUID, UserResponseDTO> userCache = new HashMap<>();

        List<ChatMessageResponseDTO> responseList = messages.stream().map(msg -> {
            UUID senderId = msg.getUserId();
            
            if (!userCache.containsKey(senderId)) {
                try {
                    UserResponseDTO userInfo = userClient.getUserProfile(token, companyIdStr, senderId);
                    userCache.put(senderId, userInfo);
                } catch (Exception e) {
                    userCache.put(senderId, null);
                }
            }
            
            UserResponseDTO sender = userCache.get(senderId);
            String fullName = formatFullName(sender, "Unknown User");
            String avatar = sender != null ? sender.avatarUrl() : null;
            String status = (sender != null && sender.status() != null) ? sender.status() : "offline"; 

            ChatMessageResponseDTO dto = ChatMessageResponseDTO.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .userId(senderId)
                .senderName(fullName)   
                .senderAvatar(avatar)  
                .senderStatus(status) 
                .content(msg.getContent())
                .type(msg.getType())
                .isEdited(msg.isEdited())
                .attachmentId(msg.getAttachmentId())
                .parentId(msg.getParentId())
                .createdAt(msg.getCreatedAt())
                .updatedAt(msg.getUpdatedAt())
                .build();

            if (msg.getAttachmentId() != null) {
                try {
                    String bearerToken = token.startsWith("Bearer ") ? token : "Bearer " + token;
                    AttachmentResponseDTO fileData = attachmentClient.getAttachmentById(bearerToken, companyIdStr, msg.getAttachmentId());
                    if (fileData != null) {
                        dto.setFileUrl(fileData.getUrl());
                        dto.setFileName(fileData.getFileName());
                        dto.setFileSize(fileData.getSize());
                    }
                } catch (Exception e) {
                    log.warn("Lỗi Feign lấy thông tin file khi load lịch sử, ID {}: {}", msg.getAttachmentId(), e.getMessage());
                }
            }

            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/groups/search")
    public ResponseEntity<?> searchGroups(
            @RequestParam("q") String keyword,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-Company-ID") String companyIdStr) {
        
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        UUID tenantId = UUID.fromString(companyIdStr);
        
        List<String> groupTypes = List.of("public_group", "private_group");
        
        List<Conversation> matchingGroups = conversationRepository
                .findByTenantIdAndNameContainingIgnoreCaseAndTypeIn(tenantId, keyword.trim(), groupTypes);

        List<UUID> userJoinedGroupIds = memberRepository.findByUserId(userId).stream()
                .map(ConversationMember::getConversationId)
                .collect(Collectors.toList());

        List<Map<String, Object>> response = matchingGroups.stream()
                .filter(g -> "public_group".equalsIgnoreCase(g.getType()) || userJoinedGroupIds.contains(g.getId()))
                .map(g -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", g.getId());
                    map.put("name", g.getName());
                    map.put("isPrivate", "private_group".equalsIgnoreCase(g.getType()));
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(
            @RequestBody CreateConversationRequestDTO request,
            @RequestHeader("Authorization") String token,
            @RequestHeader("X-User-ID") UUID creatorId,
            @RequestHeader("X-Company-ID") String companyIdStr) {
        
        if ("public_group".equalsIgnoreCase(request.type())) {
            try {
                UserResponseDTO creatorInfo = userClient.getUserProfile(token, companyIdStr, creatorId);
                boolean isSystemAdmin = creatorInfo != null && 
                    ("SUPER_ADMIN".equals(creatorInfo.role()) || "ADMIN".equals(creatorInfo.role()));
                
                if (!isSystemAdmin) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Chỉ Super Admin hoặc Admin mới có quyền tạo kênh công khai (Public Group).");
                }
            } catch (Exception e) {
                log.error("Lỗi kiểm tra quyền tạo public group: ", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Không thể xác thực quyền hạn lúc này.");
            }
        }
        
        if ("private_group".equalsIgnoreCase(request.type())) {
            long uniqueAddedMembers = 0;
            if (request.memberIds() != null) {
                uniqueAddedMembers = request.memberIds().stream()
                        .filter(id -> !id.equals(creatorId))
                        .distinct()
                        .count();
            }
        
            if (uniqueAddedMembers < 2) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("A group must have at least 3 members (including you).");
            }
        }

        UUID tenantId = UUID.fromString(companyIdStr);

        Conversation conversation = conversationRepository.save(Conversation.builder()
                .tenantId(tenantId)
                .name(request.name())
                .type(request.type()) 
                .build());

        memberRepository.save(ConversationMember.builder()
                .conversationId(conversation.getId())
                .userId(creatorId)
                .role("ADMIN") 
                .joinedAt(ZonedDateTime.now())
                .readAt(ZonedDateTime.now())
                .build());

        if (request.memberIds() != null && !request.memberIds().isEmpty()) {
            request.memberIds().forEach(memberId -> {
                if (!memberId.equals(creatorId)) {
                    memberRepository.save(ConversationMember.builder()
                            .conversationId(conversation.getId())
                            .userId(memberId)
                            .role("MEMBER")
                            .joinedAt(ZonedDateTime.now())
                            .readAt(ZonedDateTime.now()) 
                            .build());
                }
            });
        }

        UserResponseDTO creatorInfo = null;
        try {
            creatorInfo = userClient.getUserProfile(token, companyIdStr, creatorId);
        } catch (Exception ignored) {}
        
        String creatorName = formatFullName(creatorInfo, "A user");
        
        String systemMessage = creatorName + " created the channel.";
        if ("direct".equalsIgnoreCase(request.type())) {
            systemMessage = creatorName + " started the conversation.";
        } else if ("self".equalsIgnoreCase(request.type())) {
            systemMessage = "Saved messages space created.";
        }
        
        messageRepository.save(ChatMessage.builder()
                .conversationId(conversation.getId())
                .userId(creatorId) 
                .content(systemMessage)
                .type("system") 
                .isEdited(false)
                .build());

        ConversationResponseDTO responseDto = mapToResponseDTO(conversation, creatorId, token, companyIdStr);

        try {
            java.util.Set<UUID> notifyUserIds = new java.util.HashSet<>();
            notifyUserIds.add(creatorId);
            if (request.memberIds() != null) {
                notifyUserIds.addAll(request.memberIds());
            }

            for (UUID uid : notifyUserIds) {
                messagingTemplate.convertAndSend("/topic/sidebar." + uid, responseDto);
            }
        } catch (Exception e) {
            log.error("Lỗi khi bắn WebSocket cập nhật Sidebar", e);
        }

        return ResponseEntity.ok(responseDto);
    }

    private boolean checkManagePermission(Conversation conv, UUID userId, String token, String companyIdStr) {
        try {
            UserResponseDTO myInfo = userClient.getUserProfile(token, companyIdStr, userId);
            boolean isSystemAdmin = myInfo != null && ("SUPER_ADMIN".equals(myInfo.role()) || "ADMIN".equals(myInfo.role()));

            if ("public_group".equalsIgnoreCase(conv.getType())) {
                return isSystemAdmin; // Public group: Chỉ Super Admin/Admin
            } else if ("private_group".equalsIgnoreCase(conv.getType())) {
                ConversationMember myMembership = memberRepository.findByConversationId(conv.getId()).stream()
                        .filter(m -> m.getUserId().equals(userId))
                        .findFirst().orElse(null);
                boolean isGroupAdmin = myMembership != null && "ADMIN".equalsIgnoreCase(myMembership.getRole());
                return isSystemAdmin || isGroupAdmin; // Private group: Admin hệ thống hoặc người tạo nhóm
            }
        } catch (Exception e) {
            log.warn("Lỗi phân quyền: {}", e.getMessage());
        }
        return false;
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<?> addMemberToConversation(
            @PathVariable UUID conversationId,
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-ID") UUID currentUserId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {

        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return ResponseEntity.notFound().build();

        if (!checkManagePermission(conv, currentUserId, token, companyIdStr)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền mời người khác vào nhóm này");
        }

        UUID newMemberId;
        try {
            newMemberId = UUID.fromString(payload.get("userId"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ID người dùng không hợp lệ");
        }

        if (memberRepository.existsByConversationIdAndUserId(conversationId, newMemberId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Người này đã có trong nhóm rồi!");
        }

        memberRepository.save(ConversationMember.builder()
                .conversationId(conversationId)
                .userId(newMemberId)
                .role("MEMBER")
                .joinedAt(ZonedDateTime.now())
                .readAt(ZonedDateTime.now())
                .build());

        try {
            UserResponseDTO inviterInfo = userClient.getUserProfile(token, companyIdStr, currentUserId);
            UserResponseDTO inviteeInfo = userClient.getUserProfile(token, companyIdStr, newMemberId);
            
            String inviterName = formatFullName(inviterInfo, "Someone");
            String inviteeName = formatFullName(inviteeInfo, "a user");

            ChatMessage savedSysMsg = messageRepository.save(ChatMessage.builder()
                    .conversationId(conversationId)
                    .userId(currentUserId)
                    .content(inviterName + " added " + inviteeName + " to the group.")
                    .type("system")
                    .isEdited(false)
                    .build());

            ChatMessageResponseDTO sysMsgDto = ChatMessageResponseDTO.builder()
                    .id(savedSysMsg.getId())
                    .conversationId(savedSysMsg.getConversationId())
                    .userId(currentUserId)
                    .senderName(inviterName)
                    .content(savedSysMsg.getContent())
                    .type("system")
                    .createdAt(savedSysMsg.getCreatedAt())
                    .build();

            messagingTemplate.convertAndSend("/topic/room." + conversationId, sysMsgDto);

        } catch (Exception e) {
            log.error("Lỗi khi gửi system message: ", e);
        }

        try {
            if (conv != null) {
                ConversationResponseDTO sidebarDto = mapToResponseDTO(conv, newMemberId, token, companyIdStr);
                messagingTemplate.convertAndSend("/topic/sidebar." + newMemberId, sidebarDto);
            }
        } catch (Exception e) {
            log.error("Lỗi khi bắn WebSocket Sidebar cho người mới", e);
        }

        return ResponseEntity.ok().build();
    }

    @PutMapping("/conversations/{conversationId}")
    public ResponseEntity<?> renameConversation(
            @PathVariable UUID conversationId,
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {
        
        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return ResponseEntity.notFound().build();

        if (!checkManagePermission(conv, userId, token, companyIdStr)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền đổi tên nhóm này");
        }

        String newName = payload.get("name");
        if (newName != null && !newName.trim().isEmpty()) {
            conv.setName(newName.trim());
            conversationRepository.save(conv);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable UUID conversationId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {
        
        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return ResponseEntity.notFound().build();

        if (!checkManagePermission(conv, userId, token, companyIdStr)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền xóa nhóm này");
        }

        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        messageRepository.deleteAll(messages);

        List<ConversationMember> members = memberRepository.findByConversationId(conversationId);
        memberRepository.deleteAll(members);

        conversationRepository.deleteById(conversationId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversations/{conversationId}/members")
    public ResponseEntity<?> getConversationMembers(
            @PathVariable UUID conversationId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {
        
        List<ConversationMember> members = memberRepository.findByConversationId(conversationId);
        
        List<UserResponseDTO> memberProfiles = members.stream().map(m -> {
            try {
                return userClient.getUserProfile(token, companyIdStr, m.getUserId());
            } catch (Exception e) {
                return null;
            }
        }).filter(profile -> profile != null).collect(Collectors.toList());

        return ResponseEntity.ok(memberProfiles);
    }

    @PutMapping("/conversations/{conversationId}/type")
    public ResponseEntity<?> updateConversation(
            @PathVariable UUID conversationId,
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-ID") UUID userId) {
        
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền");
        }

        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return ResponseEntity.notFound().build();

        if (payload.containsKey("name")) {
            conv.setName(payload.get("name").trim());
        }

        if (payload.containsKey("type")) {
            String newType = payload.get("type");
            if ("public_group".equals(newType) || "private_group".equals(newType)) {
                conv.setType(newType);
            }
        }

        conversationRepository.save(conv);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/conversations/{conversationId}/pin")
    public ResponseEntity<?> togglePin(@PathVariable UUID conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chat"));
        
        conv.setPinned(!conv.isPinned()); 
        conversationRepository.save(conv);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/notify/announcement")
    public ResponseEntity<?> broadcastAnnouncement(
            @RequestBody Map<String, Object> payload, 
            @RequestHeader("X-Company-ID") String tenantId) {
        
        if (payload.get("targetDepartmentId") == null) {
            messagingTemplate.convertAndSend("/topic/tenant." + tenantId + ".announcements", payload);
        } else {
            messagingTemplate.convertAndSend("/topic/department." + payload.get("targetDepartmentId") + ".announcements", payload);
        }
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // HELPER: ĐẢM BẢO KHÔNG BỊ LỖI "NULL NULL"
    // ==========================================
    private String formatFullName(UserResponseDTO user, String defaultName) {
        if (user == null) return defaultName;
        String f = user.firstName() != null ? user.firstName() : "";
        String l = user.lastName() != null ? user.lastName() : "";
        String full = (f + " " + l).trim();
        return (full.isEmpty() || full.equals("null null")) ? defaultName : full;
    }

    // ==========================================
    // HELPER: OVERLOAD FIX LỖI THIẾU THAM SỐ
    // ==========================================
    private ConversationResponseDTO mapToResponseDTO(Conversation conv, UUID userId, String token, String companyIdStr) {
        // Truyền 0 để fallback dùng logic cũ đếm member trong DB
        return mapToResponseDTO(conv, userId, token, companyIdStr, 0); 
    }

    private ConversationResponseDTO mapToResponseDTO(Conversation conv, UUID userId, String token, String companyIdStr, int totalUsers) {
        String name = conv.getName();
        String avatarUrl = null;
        String type = conv.getType() != null ? conv.getType().toLowerCase() : "group";
        boolean canManage = checkManagePermission(conv, userId, token, companyIdStr);
        
        int membersCount = 0; 
        UUID targetUserIdForStatus = null; 
        
        if ("direct".equalsIgnoreCase(type)) {
            List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());
            membersCount = members.size(); 
            
            UUID otherUserId = members.stream()
                    .map(ConversationMember::getUserId)
                    .filter(id -> !id.equals(userId))
                    .findFirst()
                    .orElse(null);

            targetUserIdForStatus = otherUserId; 

            if (otherUserId != null) {
                try {
                    UserResponseDTO otherUser = userClient.getUserProfile(token, companyIdStr, otherUserId);
                    if (otherUser != null) {
                        name = formatFullName(otherUser, name);
                        avatarUrl = otherUser.avatarUrl();
                    }
                } catch (Exception ignored) {}
            }
        } else if ("self".equalsIgnoreCase(type)) {
            membersCount = 1; 
            targetUserIdForStatus = userId; 

            try {
                UserResponseDTO myInfo = userClient.getUserProfile(token, companyIdStr, userId);
                if (myInfo != null) {
                    avatarUrl = myInfo.avatarUrl(); 
                    name = formatFullName(myInfo, "Saved Messages") + " (You)";
                }
            } catch (Exception ignored) {}
        } else if ("public_group".equalsIgnoreCase(type)) {
            membersCount = totalUsers > 0 ? totalUsers : memberRepository.findByConversationId(conv.getId()).size();
        } else {
            membersCount = memberRepository.findByConversationId(conv.getId()).size();
        }

        String currentStatus = null;
        if (targetUserIdForStatus != null) {
            currentStatus = "offline";
            
            if (presenceService.isOnline(targetUserIdForStatus.toString())) {
                currentStatus = "online";
            } else {
                try {
                    UserResponseDTO memberInfo = userClient.getUserProfile(token, companyIdStr, targetUserIdForStatus);
                    if (memberInfo != null && memberInfo.status() != null) {
                        currentStatus = memberInfo.status(); 
                    }
                } catch (Exception e) {
                    log.warn("Không lấy được trạng thái cho user {}", targetUserIdForStatus);
                }
            }
        }

        return ConversationResponseDTO.builder()
                .id(conv.getId())
                .name(name)
                .type(type)
                .avatarUrl(avatarUrl)
                .status(currentStatus) 
                .membersCount(membersCount)
                .targetUserId(targetUserIdForStatus)
                .isPinned(conv.isPinned())
                .canManage(canManage)
                .build();
    }
}