package com.onfis.gateway.security;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoders;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
@EnableConfigurationProperties(SupabaseJwtProperties.class)
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .cors(Customizer.withDefaults())
                .authorizeExchange(exchanges -> exchanges
                .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/actuator/**", "/public/**").permitAll()
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
                .build();
    }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
        }

    @Bean
    public ReactiveJwtDecoder jwtDecoder(SupabaseJwtProperties properties) {
        String secret = sanitizeProperty(properties.getSecret());
        String jwkSetUri = sanitizeProperty(properties.getJwkSetUri());
        String issuer = sanitizeProperty(properties.getIssuer());

        ReactiveJwtDecoder hs256Decoder = null;
        ReactiveJwtDecoder rs256Decoder = null;
        ReactiveJwtDecoder es256Decoder = null;

        if (StringUtils.hasText(secret)) {
            byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
            SecretKey secretKey = new SecretKeySpec(bytes, 0, bytes.length, "HmacSHA256");
            hs256Decoder = NimbusReactiveJwtDecoder.withSecretKey(secretKey)
                    .macAlgorithm(MacAlgorithm.HS256)
                    .build();
        }

        if (StringUtils.hasText(jwkSetUri)) {
            rs256Decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri)
                    .jwsAlgorithm(SignatureAlgorithm.RS256)
                    .build();
            es256Decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri)
                    .jwsAlgorithm(SignatureAlgorithm.ES256)
                    .build();
        } else if (StringUtils.hasText(issuer)) {
            rs256Decoder = ReactiveJwtDecoders.fromIssuerLocation(issuer);
        }

        if (hs256Decoder == null && rs256Decoder == null) {
            throw new IllegalStateException("Supabase JWT config missing: set supabase.jwt.secret or supabase.jwt.jwk-set-uri");
        }

        ReactiveJwtDecoder finalHs256Decoder = hs256Decoder;
        ReactiveJwtDecoder finalRs256Decoder = rs256Decoder;
        ReactiveJwtDecoder finalEs256Decoder = es256Decoder;
        return token -> {
            String algorithm = extractAlgorithm(token);
            if ("HS256".equalsIgnoreCase(algorithm) && finalHs256Decoder != null) {
                return finalHs256Decoder.decode(token);
            }
            if ("ES256".equalsIgnoreCase(algorithm) && finalEs256Decoder != null) {
                return finalEs256Decoder.decode(token);
            }
            if (finalRs256Decoder != null) {
                return finalRs256Decoder.decode(token);
            }
            if (finalHs256Decoder != null) {
                return finalHs256Decoder.decode(token);
            }
            return Mono.error(new IllegalStateException("No JWT decoder available"));
        };
    }

    private String extractAlgorithm(String token) {
        try {
            int dot = token.indexOf('.');
            if (dot <= 0) {
                return null;
            }
            String headerJson = new String(Base64.getUrlDecoder().decode(token.substring(0, dot)), StandardCharsets.UTF_8);
            int index = headerJson.indexOf("\"alg\"");
            if (index < 0) {
                return null;
            }
            int colon = headerJson.indexOf(':', index);
            if (colon < 0) {
                return null;
            }
            int firstQuote = headerJson.indexOf('"', colon + 1);
            if (firstQuote < 0) {
                return null;
            }
            int secondQuote = headerJson.indexOf('"', firstQuote + 1);
            if (secondQuote < 0) {
                return null;
            }
            return headerJson.substring(firstQuote + 1, secondQuote);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String sanitizeProperty(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("${") && trimmed.endsWith("}")) {
            return null;
        }
        return trimmed;
    }
}
