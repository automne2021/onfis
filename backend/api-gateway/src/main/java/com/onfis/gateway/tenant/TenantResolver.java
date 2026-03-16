package com.onfis.gateway.tenant;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Component
public class TenantResolver {

    private static final String TENANTS_PATH = "/rest/v1/tenants";

    private final WebClient webClient;
    private final Cache<String, Optional<String>> cache;

    public TenantResolver(WebClient.Builder builder,
                          SupabaseProperties supabaseProperties,
                          TenantCacheProperties cacheProperties) {
        if (!StringUtils.hasText(supabaseProperties.getUrl())
                || !StringUtils.hasText(supabaseProperties.getServiceRoleKey())) {
            throw new IllegalStateException("Supabase URL and service role key must be configured");
        }

        this.webClient = builder
                .baseUrl(supabaseProperties.getUrl())
                .defaultHeader("apikey", supabaseProperties.getServiceRoleKey())
                .defaultHeader("Authorization", "Bearer " + supabaseProperties.getServiceRoleKey())
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();

        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(cacheProperties.getTtl())
                .maximumSize(cacheProperties.getMaxSize())
                .build();
    }

    public Mono<String> resolveTenantId(String slug) {
        Optional<String> cached = cache.getIfPresent(slug);
        if (cached != null) {
            return cached.map(Mono::just).orElseGet(Mono::empty);
        }

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(TENANTS_PATH)
                        .queryParam("select", "id")
                        .queryParam("slug", "eq." + slug)
                        .queryParam("status", "eq.ACTIVE")
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<TenantRow>>() {})
                .map(rows -> rows.isEmpty() ? null : rows.get(0).id())
                .flatMap(tenantId -> {
                    Optional<String> value = Optional.ofNullable(tenantId);
                    cache.put(slug, value);
                    return value.map(Mono::just).orElseGet(Mono::empty);
                });
    }

    private record TenantRow(String id) {}
}
