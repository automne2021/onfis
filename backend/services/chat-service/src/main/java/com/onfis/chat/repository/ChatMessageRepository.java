package com.onfis.chat.repository;

import com.onfis.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    /**
     * Lấy tối đa 50 tin nhắn gần nhất của một conversation, dùng cho tính năng AI summarize.
     */
    List<ChatMessage> findTop50ByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}