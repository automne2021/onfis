package com.onfis.chat.service;

import com.onfis.chat.dto.ChatMessageResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisPublisher {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic topic;

    public void publish(ChatMessageResponseDTO message) {
        redisTemplate.convertAndSend(topic.getTopic(), message);
    }
}