package com.onfis.chat.config;

import java.security.Principal;
import java.util.UUID;

public class OnfisPrincipal implements Principal {
    private final UUID userId;
    private final UUID tenantId;
    private final String token; 

    public OnfisPrincipal(UUID userId, UUID tenantId, String token) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.token = token;
    }

    @Override
    public String getName() { 
        return userId.toString(); 
    }
    
    public UUID getUserId() { return userId; }
    public UUID getTenantId() { return tenantId; }
    public String getToken() { return token; } 
}