package com.onfis.admin.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisCacheConfig {

        @Bean
        public RedisCacheConfiguration redisCacheConfiguration(ObjectMapper objectMapper) {
                GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer(
                                objectMapper.copy());

                return RedisCacheConfiguration.defaultCacheConfig()
                                .disableCachingNullValues()
                                .serializeKeysWith(
                                                RedisSerializationContext.SerializationPair
                                                                .fromSerializer(new StringRedisSerializer()))
                                .serializeValuesWith(
                                                RedisSerializationContext.SerializationPair
                                                                .fromSerializer(valueSerializer));
        }

        @Bean
        public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer(
                        RedisCacheConfiguration baseConfiguration) {
                return (builder) -> builder
                                .withCacheConfiguration("admin:leaderDashboard",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(60)))
                                .withCacheConfiguration("admin:ticketsList",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(45)))
                                .withCacheConfiguration("admin:ticketDetail",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(45)))
                                .withCacheConfiguration("admin:dashboard",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(60)))
                                .withCacheConfiguration("admin:settings:tenant",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(300)))
                                .withCacheConfiguration("admin:settings:storage",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(300)))
                                .withCacheConfiguration("admin:settings:modules",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(300)))
                                .withCacheConfiguration("admin:settings:security",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(300)))
                                .withCacheConfiguration("admin:settings:operations",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(300)))
                                .withCacheConfiguration("admin:auditLogs",
                                                baseConfiguration.entryTtl(Duration.ofSeconds(30)));
        }
}
