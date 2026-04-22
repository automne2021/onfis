package com.onfis.chat.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PresenceService {
    private final ConcurrentHashMap<String, AtomicInteger> activeUsers = new ConcurrentHashMap<>();

    public boolean setOnline(String userId) {
        AtomicInteger count = activeUsers.computeIfAbsent(userId, k -> new AtomicInteger(0));
        return count.incrementAndGet() == 1; 
    }

    public boolean setOffline(String userId) {
        AtomicInteger count = activeUsers.get(userId);
        if (count != null) {
            int current = count.decrementAndGet();
            if (current <= 0) {
                activeUsers.remove(userId);
                return true;
            }
        }
        return false;
    }

    public boolean isOnline(String userId) {
        return activeUsers.containsKey(userId);
    }
}