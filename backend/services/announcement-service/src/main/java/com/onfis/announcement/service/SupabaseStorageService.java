package com.onfis.announcement.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket.name:onfis}")
    private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadFile(MultipartFile file) {
        try {
            // Tạo tên file duy nhất để tránh trùng lặp
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            String endpoint = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, fileName);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);
            headers.setContentType(MediaType
                    .valueOf(file.getContentType() != null ? file.getContentType() : "application/octet-stream"));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    requestEntity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, fileName);
            } else {
                throw new RuntimeException("Lỗi từ Supabase: " + response.getBody());
            }
        } catch (Exception e) {
            log.error("Lỗi khi upload file lên Supabase: {}", e.getMessage());
            throw new RuntimeException("Không thể upload file", e);
        }
    }

    /**
     * Delete a file from Supabase Storage by its public URL.
     * Silently logs failures so that a missing/already-deleted file never blocks
     * business logic.
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank())
            return;
        try {
            // Extract the object path after "/object/public/<bucket>/"
            String prefix = String.format("%s/storage/v1/object/public/%s/", supabaseUrl, bucketName);
            String objectPath = fileUrl.startsWith(prefix) ? fileUrl.substring(prefix.length()) : null;
            if (objectPath == null || objectPath.isBlank()) {
                log.warn("Không thể trích xuất đường dẫn object từ URL: {}", fileUrl);
                return;
            }

            String endpoint = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, objectPath);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            restTemplate.exchange(endpoint, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);
            log.info("Đã xóa file khỏi Supabase: {}", objectPath);
        } catch (Exception e) {
            log.warn("Không thể xóa file Supabase (bỏ qua): {} — {}", fileUrl, e.getMessage());
        }
    }
}