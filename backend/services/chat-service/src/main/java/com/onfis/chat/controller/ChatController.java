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
                .map(conv -> mapToResponseDTO(conv, userId, token, companyIdStr))
                .collect(Collectors.toList()));
        }

        // FIX LỖI TẠI ĐÂY: Gán vào biến final để dùng trong Lambda
        final UUID finalTenantId = tempTenantId;
        final String userAuthToken = token;
        final String finalCompanyIdStr = companyIdStr;
        
        List<Conversation> publicGroups = conversationRepository.findByTenantIdAndType(finalTenantId, "public_group");
        for (Conversation pubGroup : publicGroups) {
            if (conversations.stream().noneMatch(c -> c.getId().equals(pubGroup.getId()))) {
                conversations.add(pubGroup); // Add vào Sidebar
            }
        }

        // Khởi tạo Saved Messages (Self Chat)
        boolean hasSelfChat = conversations.stream()
                .anyMatch(c -> "self".equalsIgnoreCase(c.getType()));

        if (!hasSelfChat) {
            String defaultName = userInfo != null 
                ? (userInfo.firstName() + " " + userInfo.lastName()).trim() + " (You)" 
                : "Saved Messages";

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
            // 1. Lưu User vào phòng
            memberRepository.save(ConversationMember.builder()
                    .conversationId(randomChannel.getId())
                    .userId(userId)
                    .role("MEMBER")
                    .joinedAt(ZonedDateTime.now())
                    .readAt(ZonedDateTime.now())
                    .build());
            conversations.add(randomChannel);

            // SỬA 2: Bắn tin nhắn hệ thống (SYSTEM MESSAGE)
            String userName = userInfo != null ? (userInfo.firstName() + " " + userInfo.lastName()).trim() : "A new user";
            messageRepository.save(ChatMessage.builder()
                    .conversationId(randomChannel.getId())
                    .userId(userId) 
                    .content(userName + " joined the channel.")
                    .type("system")
                    .isEdited(false)
                    .build());
        }

        List<ConversationResponseDTO> responseList = conversations.stream()
            .map(conv -> mapToResponseDTO(conv, userId, userAuthToken, finalCompanyIdStr))
            .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    private ConversationResponseDTO mapToResponseDTO(Conversation conv, UUID userId, String token, String companyIdStr) {
        String name = conv.getName();
        String avatarUrl = null;
        String type = conv.getType() != null ? conv.getType().toLowerCase() : "group";
        
        int membersCount = 0; 
        
        // 1. KHAI BÁO BIẾN Ở NGOÀI CÙNG
        UUID targetUserIdForStatus = null; 
        
        if ("direct".equalsIgnoreCase(type)) {
            List<ConversationMember> members = memberRepository.findByConversationId(conv.getId());
            membersCount = members.size(); 
            
            UUID otherUserId = members.stream()
                    .map(ConversationMember::getUserId)
                    .filter(id -> !id.equals(userId))
                    .findFirst()
                    .orElse(null);

            // Gán giá trị để lát lấy status
            targetUserIdForStatus = otherUserId; 

            if (otherUserId != null) {
                try {
                    UserResponseDTO otherUser = userClient.getUserProfile(token, companyIdStr, otherUserId);
                    if (otherUser != null) {
                        String fName = otherUser.firstName() != null ? otherUser.firstName() : "";
                        String lName = otherUser.lastName() != null ? otherUser.lastName() : "";
                        name = (fName + " " + lName).trim();
                        avatarUrl = otherUser.avatarUrl();
                    }
                } catch (Exception ignored) {}
            }
        } else if ("self".equalsIgnoreCase(type)) {
            membersCount = 1; 
            // Nếu là phòng chat với chính mình, lấy status của chính mình
            targetUserIdForStatus = userId; 

            try {
                UserResponseDTO myInfo = userClient.getUserProfile(token, companyIdStr, userId);
                if (myInfo != null) {
                    avatarUrl = myInfo.avatarUrl(); 
                    String fName = myInfo.firstName() != null ? myInfo.firstName() : "";
                    String lName = myInfo.lastName() != null ? myInfo.lastName() : "";
                    name = (fName + " " + lName).trim() + " (You)";
                }
            } catch (Exception ignored) {}
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
                .build();
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
            String fullName = "Unknown User";
            String avatar = null;
            String status = "offline";
            
            if (sender != null) {
                String fName = sender.firstName() != null ? sender.firstName() : "";
                String lName = sender.lastName() != null ? sender.lastName() : "";
                fullName = (fName + " " + lName).trim();
                avatar = sender.avatarUrl();
                status = sender.status() != null ? sender.status() : "offline"; 
            }

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
                // Check tránh add lại chính mình
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
        
        String creatorName = creatorInfo != null ? (creatorInfo.firstName() + " " + creatorInfo.lastName()).trim() : "A user";
        
        String systemMessage = creatorName + " created the channel.";
        if ("direct".equalsIgnoreCase(request.type())) {
            systemMessage = creatorName + " started the conversation.";
        } else if ("self".equalsIgnoreCase(request.type())) {
            systemMessage = "Saved messages space created.";
        }
        
        messageRepository.save(ChatMessage.builder()
                .conversationId(conversation.getId())
                .userId(creatorId) 
                .content(systemMessage) // Thay vì hardcode, ta dùng biến vừa tạo
                .type("system") 
                .isEdited(false)
                .build());

        // return ResponseEntity.ok(mapToResponseDTO(conversation, creatorId, token, companyIdStr));

        ConversationResponseDTO responseDto = mapToResponseDTO(conversation, creatorId, token, companyIdStr);

        try {
            java.util.Set<UUID> notifyUserIds = new java.util.HashSet<>();
            notifyUserIds.add(creatorId); // Bắn cho người tạo
            if (request.memberIds() != null) {
                notifyUserIds.addAll(request.memberIds()); // Bắn cho những người được mời
            }

            for (UUID uid : notifyUserIds) {
                // Phát sóng đến kênh Sidebar cá nhân của từng user
                messagingTemplate.convertAndSend("/topic/sidebar." + uid, responseDto);
            }
        } catch (Exception e) {
            log.error("Lỗi khi bắn WebSocket cập nhật Sidebar", e);
        }

        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<?> addMemberToConversation(
            @PathVariable UUID conversationId,
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-ID") UUID currentUserId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {

        // 1. Kiểm tra quyền
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền mời người khác");
        }

        UUID newMemberId;
        try {
            newMemberId = UUID.fromString(payload.get("userId"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ID người dùng không hợp lệ");
        }

        // 2. Kiểm tra trùng lặp
        if (memberRepository.existsByConversationIdAndUserId(conversationId, newMemberId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Người này đã có trong nhóm rồi!");
        }

        // 3. Thêm vào database
        memberRepository.save(ConversationMember.builder()
                .conversationId(conversationId)
                .userId(newMemberId)
                .role("MEMBER")
                .joinedAt(ZonedDateTime.now())
                .readAt(ZonedDateTime.now())
                .build());

        // 4. Bắn tin nhắn hệ thống (System Message) qua WebSocket
        try {
            UserResponseDTO inviterInfo = userClient.getUserProfile(token, companyIdStr, currentUserId);
            UserResponseDTO inviteeInfo = userClient.getUserProfile(token, companyIdStr, newMemberId);
            
            String inviterName = inviterInfo != null ? (inviterInfo.firstName() + " " + inviterInfo.lastName()).trim() : "Someone";
            String inviteeName = inviteeInfo != null ? (inviteeInfo.firstName() + " " + inviteeInfo.lastName()).trim() : "a user";

            // Lưu vào DB
            ChatMessage savedSysMsg = messageRepository.save(ChatMessage.builder()
                    .conversationId(conversationId)
                    .userId(currentUserId)
                    .content(inviterName + " added " + inviteeName + " to the group.")
                    .type("system")
                    .isEdited(false)
                    .build());

            // Tạo DTO
            ChatMessageResponseDTO sysMsgDto = ChatMessageResponseDTO.builder()
                    .id(savedSysMsg.getId())
                    .conversationId(savedSysMsg.getConversationId())
                    .userId(currentUserId)
                    .senderName(inviterName)
                    .content(savedSysMsg.getContent())
                    .type("system")
                    .createdAt(savedSysMsg.getCreatedAt())
                    .build();

            // Phát sóng (Broadcast)
            messagingTemplate.convertAndSend("/topic/room." + conversationId, sysMsgDto);

        } catch (Exception e) {
            log.error("Lỗi khi gửi system message: ", e);
        }

        try {
            Conversation conv = conversationRepository.findById(conversationId).orElse(null);
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
            @RequestHeader("X-User-ID") UUID userId) {
        
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền thao tác");
        }

        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return ResponseEntity.notFound().build();

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
            @RequestHeader("X-User-ID") UUID userId) {
        
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Không có quyền thao tác");
        }

        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        messageRepository.deleteAll(messages);

        List<ConversationMember> members = memberRepository.findByConversationId(conversationId);
        memberRepository.deleteAll(members);

        conversationRepository.deleteById(conversationId);

        return ResponseEntity.ok().build();
    }

    // ==========================================
    // LẤY DANH SÁCH THÀNH VIÊN TRONG NHÓM
    // ==========================================
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

    // ==========================================
    // Đổi tên và Đổi loại nhóm
    // ==========================================
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
        
        conv.setPinned(!conv.isPinned()); // Đảo ngược trạng thái
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

}