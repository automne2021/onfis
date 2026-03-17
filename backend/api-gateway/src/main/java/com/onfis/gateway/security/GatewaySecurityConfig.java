package com.onfis.gateway.security;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoders;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.util.StringUtils;

@Configuration
@EnableWebFluxSecurity
@EnableConfigurationProperties(SupabaseJwtProperties.class)
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/actuator/**", "/public/**").permitAll()
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
                .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder(SupabaseJwtProperties properties) {
        if (StringUtils.hasText(properties.getSecret())) {
            byte[] bytes = properties.getSecret().getBytes();
            SecretKey secretKey = new SecretKeySpec(bytes, 0, bytes.length, "HmacSHA256");
            return NimbusReactiveJwtDecoder.withSecretKey(secretKey)
                    .macAlgorithm(MacAlgorithm.HS256)
                    .build();
        }

        if (StringUtils.hasText(properties.getJwkSetUri())) {
            return NimbusReactiveJwtDecoder.withJwkSetUri(properties.getJwkSetUri()).build();
        }

        if (StringUtils.hasText(properties.getIssuer())) {
            return ReactiveJwtDecoders.fromIssuerLocation(properties.getIssuer());
        }

        throw new IllegalStateException("Supabase JWT config missing: set supabase.jwt.secret or supabase.jwt.jwk-set-uri");
    }
}
