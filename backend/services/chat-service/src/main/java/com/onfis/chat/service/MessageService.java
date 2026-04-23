package com.onfis.chat.service;

import com.onfis.chat.client.AttachmentClient;
import com.onfis.chat.client.UserClient;
import com.onfis.chat.dto.AttachmentResponseDTO;
import com.onfis.chat.dto.ChatMessageRequestDTO;
import com.onfis.chat.dto.ChatMessageResponseDTO;
import com.onfis.chat.dto.UserResponseDTO;
import com.onfis.chat.entity.ChatMessage;
import com.onfis.chat.entity.Conversation;
import com.onfis.chat.entity.ConversationMember;
import com.onfis.chat.repository.ChatMessageRepository;
import com.onfis.chat.repository.ConversationMemberRepository;
import com.onfis.chat.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final ChatMessageRepository messageRepository;
    private final ConversationMemberRepository memberRepository;
    private final RedisPublisher redisPublisher;
    private final UserClient userClient; 
    private final AttachmentClient attachmentClient;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void processAndSendMessage(ChatMessageRequestDTO request, UUID authenticatedUserId, UUID tenantId, String token) {
        
        if (!memberRepository.existsByConversationIdAndUserId(request.getConversationId(), authenticatedUserId)) {
            
            Conversation conv = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chat"));
            
            // Nếu là public thì Auto-Join, còn lại ném lỗi
            if ("public_group".equalsIgnoreCase(conv.getType()) && conv.getTenantId().equals(tenantId)) {
                memberRepository.save(ConversationMember.builder()
                        .conversationId(conv.getId())
                        .userId(authenticatedUserId)
                        .role("MEMBER")
                        .joinedAt(java.time.ZonedDateTime.now())
                        .readAt(java.time.ZonedDateTime.now())
                        .build());
            } else {
                throw new RuntimeException("Bạn không phải là thành viên của cuộc trò chuyện này"); 
            }
        }

        ChatMessage savedMessage = messageRepository.save(ChatMessage.builder()
                .conversationId(request.getConversationId())
                .userId(authenticatedUserId)     
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .isEdited(false)
                .attachmentId(request.getAttachmentId())
                .parentId(request.getParentId())
                .build());

        String fullName = "Unknown User";
        String avatar = null;
        try {
            String bearerToken = "Bearer " + token;
            String companyIdStr = (tenantId != null) ? tenantId.toString() : "";
            UserResponseDTO sender = userClient.getUserProfile(bearerToken, companyIdStr, authenticatedUserId);
            
            if (sender != null) {
                String fName = sender.firstName() != null ? sender.firstName() : "";
                String lName = sender.lastName() != null ? sender.lastName() : "";
                fullName = (fName + " " + lName).trim();
                avatar = sender.avatarUrl();
            }
        } catch (Exception e) {
            log.warn("Không thể lấy thông tin user {}: {}", authenticatedUserId, e.getMessage());
        }

        ChatMessageResponseDTO response = ChatMessageResponseDTO.builder()
                .id(savedMessage.getId())
                .conversationId(savedMessage.getConversationId())
                .userId(savedMessage.getUserId())
                .senderName(fullName)   
                .senderAvatar(avatar)   
                .content(savedMessage.getContent())
                .type(savedMessage.getType())
                .isEdited(savedMessage.isEdited())
                .attachmentId(savedMessage.getAttachmentId())
                .parentId(savedMessage.getParentId())
                .createdAt(savedMessage.getCreatedAt() != null ? savedMessage.getCreatedAt() : java.time.ZonedDateTime.now())
                .updatedAt(savedMessage.getUpdatedAt())
                .build();

        if (savedMessage.getAttachmentId() != null) {
            try {
                String bearerToken = token.startsWith("Bearer ") ? token : "Bearer " + token;
                AttachmentResponseDTO fileData = attachmentClient.getAttachmentById(bearerToken, tenantId.toString(), savedMessage.getAttachmentId());
                if (fileData != null) {
                    response.setFileUrl(fileData.getUrl());
                    response.setFileName(fileData.getFileName());
                    response.setFileSize(fileData.getSize());
                }
            } catch (Exception e) {
                log.warn("Lỗi Feign lấy thông tin file ID {}: {}", savedMessage.getAttachmentId(), e.getMessage());
            }
        }

        redisPublisher.publish(response);

        try {
            List<ConversationMember> members = memberRepository.findByConversationId(request.getConversationId());
            for (ConversationMember member : members) {
                // Không bắn thông báo cho chính người gửi
                if (!member.getUserId().equals(authenticatedUserId)) {
                    messagingTemplate.convertAndSend(
                        "/topic/user." + member.getUserId() + ".chat_notifications", 
                        response
                    );
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi bắn WebSocket notification cho chat: ", e);
        }
    }

    public ChatMessageResponseDTO convertToDTO(ChatMessage message, String token, String companyIdStr) {
        
        String fullName = "Unknown User";
        String avatar = null;
        String currentStatus = "offline"; 
        
        try {
            String bearerToken = token.startsWith("Bearer ") ? token : "Bearer " + token;
            UserResponseDTO sender = userClient.getUserProfile(bearerToken, companyIdStr, message.getUserId());
            
            if (sender != null) {
                String fName = sender.firstName() != null ? sender.firstName() : "";
                String lName = sender.lastName() != null ? sender.lastName() : "";
                fullName = (fName + " " + lName).trim();
                avatar = sender.avatarUrl();
                currentStatus = sender.status() != null ? sender.status() : "offline";
            }
        } catch (Exception e) {
            log.warn("Không thể lấy thông tin user {}: {}", message.getUserId(), e.getMessage());
        }

        ChatMessageResponseDTO.ChatMessageResponseDTOBuilder responseBuilder = ChatMessageResponseDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .userId(message.getUserId())
                .senderName(fullName)
                .senderAvatar(avatar)
                .senderStatus(currentStatus) 
                .content(message.getContent())
                .type(message.getType())
                .isEdited(message.isEdited())
                .attachmentId(message.getAttachmentId())
                .parentId(message.getParentId())
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt() : java.time.ZonedDateTime.now())
                .updatedAt(message.getUpdatedAt());

        // 3. Gọi qua announcement-service lấy thông tin File
        if (message.getAttachmentId() != null) {
            try {
                AttachmentResponseDTO fileData = attachmentClient.getAttachmentById(token, companyIdStr, message.getAttachmentId());
                if (fileData != null) {
                    responseBuilder.fileUrl(fileData.getUrl());
                    responseBuilder.fileName(fileData.getFileName());
                    responseBuilder.fileSize(fileData.getSize());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi lấy thông tin file từ announcement-service cho attachment_id: {}", message.getAttachmentId());
                responseBuilder.fileName("File bị lỗi hoặc đã xóa");
            }
        }

        return responseBuilder.build();
    }
}