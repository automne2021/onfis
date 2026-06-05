package com.onfis.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiService {

    private final RestTemplate restTemplate;

    @Value("${ai.gemini.api-key:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    @Value("${ai.gemini.max-output-tokens:4096}")
    private int maxOutputTokens;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Gửi prompt tới Gemini API và trả về text response.
     */
    public String generateContent(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("GEMINI_API_KEY chưa được cấu hình");
            return "⚠️ Onfis Assistant chưa được cấu hình API key. Vui lòng liên hệ quản trị viên.";
        }

        String url = baseUrl + "/" + model + ":generateContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", maxOutputTokens
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return extractText(response.getBody());
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API: {}", e.getMessage());
            return "⚠️ Xin lỗi, Onfis Assistant đang gặp sự cố. Vui lòng thử lại sau.";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> responseBody) {
        try {
            List<?> candidates = (List<?>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return "⚠️ Không nhận được phản hồi từ AI.";
            }
            Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
            List<?> parts = (List<?>) content.get("parts");
            Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
            return (String) firstPart.get("text");
        } catch (Exception e) {
            log.error("Lỗi khi parse Gemini response: {}", e.getMessage());
            return "⚠️ Lỗi xử lý phản hồi từ AI.";
        }
    }
}
