package com.onfis.gateway.filter;

import com.onfis.gateway.tenant.TenantResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Slf4j
@Component
public class TenantHeaderFilter implements GlobalFilter, Ordered {

    private static final String TENANT_HEADER = "X-Company-ID";
    private static final String USER_HEADER = "X-User-ID";
    private static final String SLUG_PATTERN = "^[a-z0-9-]+$";
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173");

    private final TenantResolver tenantResolver;

    public TenantHeaderFilter(TenantResolver tenantResolver) {
        this.tenantResolver = tenantResolver;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getURI().getRawPath();
        log.info("🚪 [GATEWAY-IN] Nhận request tới đường dẫn: {}", path);

        String slug = extractFirstSegment(path);

        // --- 1. LUỒNG API PUBLIC ---
        if (isPublicPath(path)) {
            return tenantResolver.resolveTenantId(slug)
                    .switchIfEmpty(Mono.error(
                            new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant không tồn tại hoặc inactive")))
                    .flatMap(resolvedTenantId -> {
                        log.info("✅ [GATEWAY-PUBLIC] Đã gắn Header X-Company-ID: {}", resolvedTenantId);
                        ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                                .header(TENANT_HEADER, resolvedTenantId).build();
                        return chain.filter(exchange.mutate().request(modifiedRequest).build());
                    })
                    // HỨNG LỖI CỦA LUỒNG PUBLIC Ở ĐÂY (Không dùng switchIfEmpty phía sau)
                    .onErrorResume(ResponseStatusException.class,
                            e -> writeError(exchange, e.getStatusCode(), e.getReason()))
                    .onErrorResume(e -> {
                        log.error("🚨 Lỗi khi Gateway gọi API Supabase: {}", e.getMessage());
                        return writeError(exchange, HttpStatus.INTERNAL_SERVER_ERROR,
                                "Lỗi kết nối từ Gateway tới Supabase");
                    });
        }

        // --- 2. KIỂM TRA SLUG ---
        if (!StringUtils.hasText(slug) || !slug.matches(SLUG_PATTERN)) {
            log.warn("🚨 [GATEWAY] Slug không hợp lệ. Trả về 404.");
            return writeError(exchange, HttpStatus.NOT_FOUND, "Slug không hợp lệ");
        }

        // --- 3. LUỒNG API PRIVATE (XÁC THỰC TOKEN) ---
        return exchange.getPrincipal()
                .cast(JwtAuthenticationToken.class)
                // ĐÁNH CHẶN 1: Nếu không có Principal (chưa đăng nhập), ném lỗi 401 ngay lập
                // tức
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized - Missing Principal")))
                .flatMap(authentication -> {
                    Jwt jwt = authentication.getToken();
                    java.util.Map<String, Object> appMetadata = jwt.getClaimAsMap("app_metadata");
                    String tenantClaim = appMetadata != null ? (String) appMetadata.get("tenant_id") : null;
                    String userId = jwt.getSubject();

                    return tenantResolver.resolveTenantId(slug)
                            // ĐÁNH CHẶN 2: Nếu Supabase trả về rỗng, ném lỗi 404 ngay lập tức
                            .switchIfEmpty(Mono.error(
                                    new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found or inactive")))
                            .flatMap(resolvedTenantId -> {
                                if (StringUtils.hasText(tenantClaim) && !tenantClaim.equals(resolvedTenantId)) {
                                    return writeError(exchange, HttpStatus.FORBIDDEN, "Tenant mismatch");
                                }

                                log.info("✅ [GATEWAY-OUT] Xác thực thành công! Gắn Header và chuyển tiếp.");
                                ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                                        .header(TENANT_HEADER, resolvedTenantId)
                                        .header(USER_HEADER, userId)
                                        .build();
                                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                            });
                })
                // BẮT TẤT CẢ EXCEPTION VÀ GHI ERROR RESPONSE CHUẨN XÁC (Tránh
                // UnsupportedOperationException)
                .onErrorResume(ResponseStatusException.class, e -> {
                    log.warn("🚨 [GATEWAY] Bị chặn: {}", e.getReason());
                    return writeError(exchange, e.getStatusCode(), e.getReason());
                })
                .onErrorResume(e -> {
                    log.error("🚨 [GATEWAY] Lỗi không xác định: {}", e.getMessage());
                    return writeError(exchange, HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error");
                });
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

    private Mono<Void> writeError(ServerWebExchange exchange, org.springframework.http.HttpStatusCode status,
            String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.TEXT_PLAIN);
        applyCorsHeaders(exchange);
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse()
                .bufferFactory()
                .wrap(bytes)));
    }

    private void applyCorsHeaders(ServerWebExchange exchange) {
        String origin = exchange.getRequest().getHeaders().getOrigin();
        if (StringUtils.hasText(origin) && ALLOWED_ORIGINS.contains(origin)) {
            exchange.getResponse().getHeaders().setAccessControlAllowOrigin(origin);
            exchange.getResponse().getHeaders().setAccessControlAllowCredentials(true);
            exchange.getResponse().getHeaders().add("Vary", "Origin");
        }
    }

    private boolean isPublicPath(String path) {
        return path != null && (path.startsWith("/actuator") ||
                path.startsWith("/public") ||
                path.contains("/ws/")); // Thêm điều kiện này
    }
}