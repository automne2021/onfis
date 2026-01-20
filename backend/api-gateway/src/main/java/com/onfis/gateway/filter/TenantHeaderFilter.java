package com.onfis.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global filter to forward multi-tenancy header to all services
 */
@Slf4j
@Component
public class TenantHeaderFilter implements GlobalFilter, Ordered {
    
    private static final String TENANT_HEADER = "X-Company-ID";
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String companyId = request.getHeaders().getFirst(TENANT_HEADER);
        
        if (companyId != null && !companyId.isEmpty()) {
            log.debug("Forwarding tenant header: {} = {}", TENANT_HEADER, companyId);
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header(TENANT_HEADER, companyId)
                    .build();
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        }
        
        return chain.filter(exchange);
    }
    
    @Override
    public int getOrder() {
        return -100; // Execute before other filters
    }
}
