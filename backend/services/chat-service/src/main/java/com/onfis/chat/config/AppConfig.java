package com.onfis.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AppConfig {

    /**
     * Executor chuyên dụng cho các tác vụ gọi AI (Gemini API).
     * Pool nhỏ tránh quá tải, nhưng đủ để xử lý song song.
     */
    @Bean(name = "aiTaskExecutor")
    public Executor aiTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ai-assistant-");
        executor.initialize();
        return executor;
    }

    /**
     * RestTemplate dùng để gọi Gemini REST API.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
