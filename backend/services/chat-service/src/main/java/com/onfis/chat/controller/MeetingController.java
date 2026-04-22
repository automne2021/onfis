package com.onfis.chat.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

// Thay đổi Import Entity thành số nhiều theo hệ thống của bạn
import com.onfis.chat.entity.Meetings;
import com.onfis.chat.entity.MeetingParticipants;
import com.onfis.chat.entity.ChatMessage;
import com.onfis.chat.dto.CreateMeetingDTO;
import com.onfis.chat.dto.MeetingDTO;
import com.onfis.chat.dto.ChatMessageResponseDTO;
import com.onfis.chat.dto.UserResponseDTO;

import com.onfis.chat.repository.ChatMessageRepository;
import com.onfis.chat.repository.ConversationMemberRepository;
import com.onfis.chat.repository.MeetingRepository;
import com.onfis.chat.repository.MeetingParticipantRepository;

import com.onfis.chat.client.UserClient;      
import com.onfis.chat.service.LiveKitService;

@Slf4j
@RestController
@RequestMapping("/chat/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository participantRepository;
    private final ConversationMemberRepository memberRepository;     
    private final ChatMessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserClient userClient;
    private final LiveKitService liveKitService;

    // ==========================================
    // 1. TẠO CUỘC GỌI
    // ==========================================
    @PostMapping
    public ResponseEntity<?> createMeeting(
            @RequestBody CreateMeetingDTO request,
            @RequestHeader("X-User-ID") UUID hostId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {
        
        // 1. Parse Company ID thành UUID
        UUID tenantId = null;
        if (companyIdStr != null) {
            try { tenantId = UUID.fromString(companyIdStr); } catch (Exception ignored) {}
        }

        String meetingTitle = "VIDEO".equalsIgnoreCase(request.getType()) ? "Video Call" : "Audio Call";

        Meetings meeting = meetingRepository.save(Meetings.builder()
                .tenantId(tenantId) 
                .conversationId(request.getConversationId())
                .hostId(hostId)
                .title(meetingTitle)
                .type(request.getType()) 
                .status("ONGOING")
                .startTime(ZonedDateTime.now())
                .meetingLink("room_" + UUID.randomUUID().toString()) 
                .build());

        ChatMessage msg = messageRepository.save(ChatMessage.builder()
                .conversationId(request.getConversationId())
                .userId(hostId)
                .type("meeting") 
                // .attachmentId(meeting.getId()) 
                .content(meeting.getId().toString())
                .build());

        String senderName = "Unknown User";
        String senderAvatar = null;
        try {
            UserResponseDTO hostInfo = userClient.getUserProfile(token, companyIdStr, hostId);
            if (hostInfo != null) {
                senderName = (hostInfo.firstName() + " " + hostInfo.lastName()).trim();
                senderAvatar = hostInfo.avatarUrl();
            }
        } catch (Exception e) {
            log.warn("Không lấy được thông tin host: {}", e.getMessage());
        }

        ChatMessageResponseDTO responseDTO = ChatMessageResponseDTO.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .userId(hostId)
                .senderName(senderName)    
                .senderAvatar(senderAvatar) 
                .type("meeting")
                .meeting(mapToMeetingDTO(meeting)) 
                .createdAt(msg.getCreatedAt())
                .build();

        messagingTemplate.convertAndSend("/topic/room." + request.getConversationId(), responseDTO);

        return ResponseEntity.ok(responseDTO);
    }

    // ==========================================
    // 2. JOIN CUỘC GỌI LẤY TOKEN LIVEKIT THẬT
    // ==========================================
    @GetMapping("/{meetingId}/join")
    public ResponseEntity<?> joinMeeting(
            @PathVariable UUID meetingId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "X-Company-ID", required = false) String companyIdStr) {
        
        Meetings meeting = meetingRepository.findById(meetingId).orElse(null);
        if (meeting == null || "ENDED".equals(meeting.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cuộc gọi không tồn tại hoặc đã kết thúc.");
        }

        if (!memberRepository.existsByConversationIdAndUserId(meeting.getConversationId(), userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền tham gia.");
        }

        if (!participantRepository.existsByMeetingIdAndUserId(meetingId, userId)) {
            participantRepository.save(MeetingParticipants.builder()
                    .meetingId(meetingId)
                    .userId(userId)
                    .status("ACCEPTED")
                    .role(meeting.getHostId().equals(userId) ? "HOST" : "ATTENDEE")
                    .joinedAt(ZonedDateTime.now())
                    .build());
        }

        // LẤY TÊN USER ĐỂ HIỂN THỊ TRONG VIDEO CALL
        String userName = "Guest";
        try {
            UserResponseDTO userInfo = userClient.getUserProfile(token, companyIdStr, userId);
            if (userInfo != null) {
                userName = (userInfo.firstName() + " " + userInfo.lastName()).trim();
            }
        } catch (Exception ignored) {}

        // SỬ DỤNG LIVEKIT SERVICE ĐỂ TẠO TOKEN THẬT
        String videoToken = liveKitService.createToken(meeting.getMeetingLink(), userId.toString(), userName); 

        return ResponseEntity.ok(Map.of(
                "roomName", meeting.getMeetingLink(),
                "token", videoToken
        ));
    }

    // ==========================================
    // 3. KẾT THÚC CUỘC GỌI
    // ==========================================
    @PutMapping("/{meetingId}/end")
    public ResponseEntity<?> endMeeting(
            @PathVariable UUID meetingId,
            @RequestHeader("X-User-ID") UUID userId) {
        
        // SỬA: Meeting -> Meetings
        Meetings meeting = meetingRepository.findById(meetingId).orElse(null);
        if (meeting == null) return ResponseEntity.notFound().build();

        // Chỉ Host mới được tắt cuộc gọi chung
        if (!meeting.getHostId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ host mới được kết thúc cuộc gọi.");
        }

        meeting.setStatus("ENDED");
        meeting.setEndTime(ZonedDateTime.now());
        meetingRepository.save(meeting);

        // Bắn tín hiệu WebSocket để Frontend cập nhật cái Thẻ MeetingCard thành màu xám
        messagingTemplate.convertAndSend("/topic/room." + meeting.getConversationId() + ".meetingEnded", meetingId);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{meetingId}")
    public ResponseEntity<?> getMeeting(@PathVariable UUID meetingId) {
        Meetings meeting = meetingRepository.findById(meetingId).orElse(null);
        if (meeting == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(mapToMeetingDTO(meeting));
    }

    // ==========================================
    // HELPER: MAP ENTITY SANG DTO
    // ==========================================
    // SỬA: Meeting -> Meetings
    private MeetingDTO mapToMeetingDTO(Meetings meeting) {
        return MeetingDTO.builder()
                .id(meeting.getId())
                .hostId(meeting.getHostId())
                .type(meeting.getType())
                .status(meeting.getStatus())
                .startTime(meeting.getStartTime())
                .endTime(meeting.getEndTime())
                .meetingLink(meeting.getMeetingLink())
                .build();
    }

    @PostMapping("/{meetingId}/end")
    public ResponseEntity<?> endMeeting(@PathVariable UUID meetingId) {
        Meetings meeting = meetingRepository.findById(meetingId).orElse(null);
        if (meeting == null) return ResponseEntity.notFound().build();
        
        // 1. Cập nhật trạng thái trong DB
        meeting.setStatus("ENDED");
        meetingRepository.save(meeting);
        
        // 2. Phát tín hiệu "Đá mọi người" qua WebSocket
        // Chúng ta gửi ID của meeting bị kết thúc để Frontend kiểm tra
        messagingTemplate.convertAndSend(
            "/topic/room." + meeting.getConversationId() + ".meetingEnded", 
            meetingId.toString()
        );
        
        return ResponseEntity.ok().build();
    }
}