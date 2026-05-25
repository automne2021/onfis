package com.onfis.chat.service;

import com.onfis.chat.client.AttachmentClient;
import com.onfis.chat.client.ProjectClient;
import com.onfis.chat.client.UserClient;
import com.onfis.chat.dto.ChatMessageResponseDTO;
import com.onfis.chat.entity.ChatMessage;
import com.onfis.chat.entity.ConversationMember;
import com.onfis.chat.repository.ChatMessageRepository;
import com.onfis.chat.repository.ConversationMemberRepository;
import com.onfis.chat.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final GeminiService geminiService;
    private final ChatMessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final UserClient userClient;
    private final ProjectClient projectClient;
    private final AttachmentClient attachmentClient;
    private final RedisPublisher redisPublisher;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${ai.bot.user-id:00000000-0000-0000-0000-000000000b07}")
    private String botUserIdStr;

    private static final String BOT_NAME = "Onfis Assistant";
    private static final String COMMAND_SUMMARIZE = "summarize";
    private static final String COMMAND_TASKS = "tasks";
    private static final String COMMAND_ANNOUNCEMENTS = "announcements";

    /**
     * Xử lý lệnh AI bất đồng bộ để không block WebSocket handler thread.
     * Cú pháp: @summarize <tên_kênh> | @tasks | @announcements
     */
    @Async("aiTaskExecutor")
    @Transactional
    public void processCommand(String content, UUID assistantConversationId,
                               UUID requestingUserId, UUID tenantId, String token) {
        String trimmed = content.trim();
        if (!trimmed.startsWith("@")) {
            return;
        }
        // Tách "@command argument"
        String withoutAt = trimmed.substring(1).trim();
        String[] parts = withoutAt.split("\\s+", 2);
        String command = parts[0].toLowerCase();
        String argument = parts.length > 1 ? parts[1].trim() : "";

        log.info("Xử lý lệnh AI: command='{}' arg='{}' userId={}", command, argument, requestingUserId);

        String bearerToken = token.startsWith("Bearer ") ? token : "Bearer " + token;
        String companyId = tenantId.toString();

        try {
            switch (command) {
                case COMMAND_SUMMARIZE -> handleSummarize(argument, assistantConversationId,
                        requestingUserId, tenantId, bearerToken, companyId);
                case COMMAND_TASKS -> handleTasks(assistantConversationId, requestingUserId,
                        tenantId, bearerToken, companyId);
                case COMMAND_ANNOUNCEMENTS -> handleAnnouncements(assistantConversationId,
                        requestingUserId, tenantId, bearerToken, companyId);
                default -> publishBotReply(assistantConversationId, tenantId,
                        "❓ Lệnh không hợp lệ. Các lệnh được hỗ trợ:\n" +
                        "• `@summarize <tên kênh>` — Tóm tắt 50 tin nhắn gần nhất của kênh\n" +
                        "• `@tasks` — Xem các công việc được giao hôm nay\n" +
                        "• `@announcements` — Tóm tắt thông báo 7 ngày gần nhất");
            }
        } catch (Exception e) {
            log.error("Lỗi khi xử lý lệnh AI '{}': {}", command, e.getMessage(), e);
            publishBotReply(assistantConversationId, tenantId,
                    "⚠️ Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.");
        }
    }

    // ─── @summarize <tên_kênh> ────────────────────────────────────────────────

    private void handleSummarize(String channelName, UUID assistantConversationId,
                                 UUID requestingUserId, UUID tenantId,
                                 String bearerToken, String companyId) {
        if (channelName.isBlank()) {
            publishBotReply(assistantConversationId, tenantId,
                    "❓ Vui lòng cung cấp tên kênh. Ví dụ: `@summarize random`");
            return;
        }

        // Tìm conversation theo tên trong cùng tenant
        var conversationOpt = conversationRepository.findFirstByTenantIdAndName(tenantId, channelName);
        if (conversationOpt.isEmpty()) {
            publishBotReply(assistantConversationId, tenantId,
                    "❌ Không tìm thấy kênh tên **" + channelName + "**. Vui lòng kiểm tra lại tên kênh.");
            return;
        }
        var targetConversation = conversationOpt.get();

        // Kiểm tra quyền: user phải là thành viên của kênh cần tóm tắt
        boolean isMember = memberRepository.existsByConversationIdAndUserId(
                targetConversation.getId(), requestingUserId);
        if (!isMember) {
            publishBotReply(assistantConversationId, tenantId,
                    "🔒 Bạn không có quyền tóm tắt kênh **" + channelName +
                    "** vì bạn chưa là thành viên của kênh này.");
            return;
        }

        // Lấy 50 tin nhắn gần nhất
        List<ChatMessage> messages = messageRepository
                .findTop50ByConversationIdOrderByCreatedAtDesc(targetConversation.getId());
        if (messages.isEmpty()) {
            publishBotReply(assistantConversationId, tenantId,
                    "📭 Kênh **" + channelName + "** chưa có tin nhắn nào để tóm tắt.");
            return;
        }
        // Đảo lại để theo thứ tự thời gian tăng dần
        List<ChatMessage> chronological = messages.reversed();

        // Xây dựng nội dung đoạn chat dạng text
        StringBuilder chatContent = new StringBuilder();
        for (ChatMessage msg : chronological) {
            if ("system".equalsIgnoreCase(msg.getType()) || "meeting".equalsIgnoreCase(msg.getType())) {
                continue;
            }
            String senderName = resolveSenderName(msg.getUserId(), bearerToken, companyId);
            String time = msg.getCreatedAt() != null
                    ? msg.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm dd/MM"))
                    : "";
            chatContent.append("[").append(time).append("] ")
                       .append(senderName).append(": ")
                       .append(msg.getContent()).append("\n");
        }

        String prompt = """
                Bạn là trợ lý AI của hệ thống ERP Onfis. Dưới đây là lịch sử trò chuyện của kênh "%s".
                Hãy tóm tắt ngắn gọn bằng tiếng Việt theo cấu trúc sau:
                1. **Các chủ đề chính được thảo luận**
                2. **Quyết định quan trọng đã được đưa ra** (nếu có)
                3. **Các công việc (action items) cần thực hiện và người phụ trách** (nếu có)
                
                Lịch sử trò chuyện:
                %s
                """.formatted(channelName, chatContent);

        String summary = geminiService.generateContent(prompt);
        publishBotReply(assistantConversationId, tenantId,
                "📋 **Tóm tắt kênh #" + channelName + "** (50 tin nhắn gần nhất):\n\n" + summary);
    }

    // ─── @tasks ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void handleTasks(UUID assistantConversationId, UUID requestingUserId,
                             UUID tenantId, String bearerToken, String companyId) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        Map<String, Object> response;
        try {
            response = projectClient.getMyTasks(
                    requestingUserId.toString(), companyId, "assigned", null, 0, 20);
        } catch (Exception e) {
            log.warn("Không thể gọi project-service để lấy tasks: {}", e.getMessage());
            publishBotReply(assistantConversationId, tenantId,
                    "⚠️ Không thể kết nối đến dịch vụ quản lý công việc. Vui lòng thử lại sau.");
            return;
        }

        List<Map<String, Object>> tasks = (List<Map<String, Object>>) response.getOrDefault("content", List.of());
        if (tasks.isEmpty()) {
            publishBotReply(assistantConversationId, tenantId,
                    "✅ Bạn không có công việc nào được giao có hạn hôm nay (" + today + ").");
            return;
        }

        StringBuilder taskList = new StringBuilder();
        for (Map<String, Object> task : tasks) {
            String title = (String) task.getOrDefault("title", "Không có tiêu đề");
            String status = (String) task.getOrDefault("status", "");
            String priority = (String) task.getOrDefault("priority", "");
            String dueDate = task.get("dueDate") != null ? task.get("dueDate").toString() : "";
            taskList.append("- [").append(priority.toUpperCase()).append("] ")
                    .append(title)
                    .append(" | Trạng thái: ").append(status)
                    .append(" | Hạn: ").append(dueDate).append("\n");
        }

        String prompt = """
                Bạn là trợ lý AI của hệ thống ERP Onfis. Dưới đây là danh sách công việc hôm nay (%s) của nhân viên.
                Hãy viết một đoạn tóm tắt ngắn gọn bằng tiếng Việt theo cấu trúc:
                1. **Tổng quan** (số lượng task, mức độ ưu tiên cao nhất)
                2. **Các việc cần ưu tiên xử lý ngay** (URGENT/HIGH priority trước)
                3. **Lời nhắc nhở ngắn** (khuyến khích, động lực)
                
                Danh sách công việc:
                %s
                """.formatted(today, taskList);

        String summary = geminiService.generateContent(prompt);
        publishBotReply(assistantConversationId, tenantId,
                "📅 **Công việc hôm nay của bạn** (" + today + "):\n\n" + summary);
    }

    // ─── @announcements ───────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void handleAnnouncements(UUID assistantConversationId, UUID requestingUserId,
                                     UUID tenantId, String bearerToken, String companyId) {
        Map<String, Object> response;
        try {
            response = attachmentClient.getAnnouncements(bearerToken, companyId,
                    requestingUserId.toString(), 0, 10);
        } catch (Exception e) {
            log.warn("Không thể gọi announcement-service: {}", e.getMessage());
            publishBotReply(assistantConversationId, tenantId,
                    "⚠️ Không thể kết nối đến dịch vụ thông báo. Vui lòng thử lại sau.");
            return;
        }

        List<Map<String, Object>> allItems = (List<Map<String, Object>>) response.getOrDefault("content", List.of());

        // Lọc thông báo trong 7 ngày gần nhất
        ZonedDateTime sevenDaysAgo = ZonedDateTime.now().minusDays(7);
        StringBuilder announcementList = new StringBuilder();
        int count = 0;
        for (Map<String, Object> item : allItems) {
            String createdAtStr = (String) item.get("createdAt");
            if (createdAtStr != null) {
                try {
                    ZonedDateTime createdAt = ZonedDateTime.parse(createdAtStr);
                    if (createdAt.isBefore(sevenDaysAgo)) continue;
                } catch (Exception ignored) { /* nếu parse lỗi thì vẫn include */ }
            }
            String title = (String) item.getOrDefault("title", "Không có tiêu đề");
            String content = (String) item.getOrDefault("content", "");
            // Cắt ngắn content nếu quá dài
            if (content.length() > 300) content = content.substring(0, 300) + "...";
            announcementList.append("- **").append(title).append("**: ").append(content).append("\n");
            count++;
        }

        if (count == 0) {
            publishBotReply(assistantConversationId, tenantId,
                    "📭 Không có thông báo mới nào trong 7 ngày gần nhất.");
            return;
        }

        String prompt = """
                Bạn là trợ lý AI của hệ thống ERP Onfis. Dưới đây là danh sách thông báo nội bộ trong 7 ngày gần nhất.
                Hãy tóm tắt ngắn gọn bằng tiếng Việt theo cấu trúc:
                1. **Tóm tắt nhanh** (3-4 gạch đầu dòng, những thông tin quan trọng nhất mà nhân viên cần biết)
                2. **Hành động cần thực hiện** (nếu có thông báo yêu cầu nhân viên làm gì)
                
                Danh sách thông báo:
                %s
                """.formatted(announcementList);

        String summary = geminiService.generateContent(prompt);
        publishBotReply(assistantConversationId, tenantId,
                "📢 **Tóm tắt thông báo nội bộ** (7 ngày gần nhất):\n\n" + summary);
    }

    // ─── Helper: Publish bot reply ────────────────────────────────────────────

    public void publishBotReply(UUID conversationId, UUID tenantId, String content) {
        UUID botUserId = UUID.fromString(botUserIdStr);

        ChatMessage botMessage = messageRepository.save(ChatMessage.builder()
                .conversationId(conversationId)
                .userId(botUserId)
                .content(content)
                .type("TEXT")
                .isEdited(false)
                .build());

        ChatMessageResponseDTO response = ChatMessageResponseDTO.builder()
                .id(botMessage.getId())
                .conversationId(conversationId)
                .userId(botUserId)
                .senderName(BOT_NAME)
                .senderAvatar(null)
                .senderStatus("online")
                .content(content)
                .type("TEXT")
                .isEdited(false)
                .createdAt(botMessage.getCreatedAt() != null ? botMessage.getCreatedAt() : ZonedDateTime.now())
                .updatedAt(botMessage.getUpdatedAt())
                .build();

        // Publish qua Redis để distribute tới tất cả instances
        redisPublisher.publish(response);

        // Notify thành viên của conversation qua WebSocket
        try {
            List<ConversationMember> members = memberRepository.findByConversationId(conversationId);
            for (ConversationMember member : members) {
                messagingTemplate.convertAndSend(
                        "/topic/user." + member.getUserId() + ".chat_notifications", response);
            }
        } catch (Exception e) {
            log.error("Lỗi khi gửi bot notification: {}", e.getMessage());
        }
    }

    // ─── Helper: Lấy tên sender ───────────────────────────────────────────────

    private String resolveSenderName(UUID userId, String bearerToken, String companyId) {
        UUID botUserId = UUID.fromString(botUserIdStr);
        if (botUserId.equals(userId)) return BOT_NAME;
        try {
            var user = userClient.getUserProfile(bearerToken, companyId, userId);
            if (user != null) {
                String fn = user.firstName() != null ? user.firstName() : "";
                String ln = user.lastName() != null ? user.lastName() : "";
                return (fn + " " + ln).trim();
            }
        } catch (Exception e) {
            log.warn("Không lấy được tên user {}: {}", userId, e.getMessage());
        }
        return "Người dùng";
    }
}
