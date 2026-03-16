package com.onfis.gateway.filter;

import com.onfis.gateway.tenant.TenantResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Resolve tenant slug from the first path segment and inject tenant ID header.
 */
@Slf4j
@Component
public class TenantHeaderFilter implements GlobalFilter, Ordered {

    private static final String TENANT_HEADER = "X-Company-ID";
    private static final String USER_HEADER = "X-User-ID";
    private static final String NOT_FOUND_MESSAGE = "Tenant not found or inactive";
    private static final String UNAUTHORIZED_MESSAGE = "Unauthorized";
    private static final String FORBIDDEN_MESSAGE = "Tenant mismatch";
    private static final String SLUG_PATTERN = "^[a-z0-9-]+$";

    private final TenantResolver tenantResolver;

    public TenantHeaderFilter(TenantResolver tenantResolver) {
        this.tenantResolver = tenantResolver;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getRawPath();
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        String slug = extractFirstSegment(path);
        if (!StringUtils.hasText(slug) || !slug.matches(SLUG_PATTERN)) {
            return writeNotFound(exchange);
        }

        return exchange.getPrincipal()
            .cast(JwtAuthenticationToken.class)
            .flatMap(authentication -> {
                    Jwt jwt = authentication.getToken();
                    String tenantClaim = jwt.getClaimAsString("tenant_id");
                    String userId = jwt.getSubject();

                    if (!StringUtils.hasText(tenantClaim)) {
                        return writeUnauthorized(exchange);
                    }

                    return tenantResolver.resolveTenantId(slug)
                            .flatMap(resolvedTenantId -> {
                                if (!tenantClaim.equals(resolvedTenantId)) {
                                    return writeForbidden(exchange);
                                }

                                ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                                        .header(TENANT_HEADER, tenantClaim)
                                        .header(USER_HEADER, userId)
                                        .build();
                                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                            })
                            .switchIfEmpty(writeNotFound(exchange));
                })
                .switchIfEmpty(writeUnauthorized(exchange));
    }

    @Override
    public int getOrder() {
        return -100;
    }

    private String extractFirstSegment(String rawPath) {
        if (!StringUtils.hasText(rawPath)) {
            return null;
        }
        String path = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
        int slashIndex = path.indexOf('/');
        return slashIndex == -1 ? path : path.substring(0, slashIndex);
    }

    private Mono<Void> writeNotFound(ServerWebExchange exchange) {
        return writeError(exchange, HttpStatus.NOT_FOUND, NOT_FOUND_MESSAGE);
    }

    private Mono<Void> writeUnauthorized(ServerWebExchange exchange) {
        return writeError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
    }

    private Mono<Void> writeForbidden(ServerWebExchange exchange) {
        return writeError(exchange, HttpStatus.FORBIDDEN, FORBIDDEN_MESSAGE);
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.TEXT_PLAIN);
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse()
                .bufferFactory()
                .wrap(bytes)));
    }

    private boolean isPublicPath(String path) {
        return path != null && (path.startsWith("/actuator") || path.startsWith("/public"));
    }
}
