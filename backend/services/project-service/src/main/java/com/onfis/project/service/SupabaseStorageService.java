package com.onfis.project.service;

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

    public String uploadFile(String folder, MultipartFile file) {
        try {
            String fileName = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
            String endpoint = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, fileName);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);
            headers.setContentType(MediaType
                    .valueOf(file.getContentType() != null ? file.getContentType() : "application/octet-stream"));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, fileName);
            } else {
                throw new RuntimeException("Supabase error: " + response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to upload file to Supabase: {}", e.getMessage());
            throw new RuntimeException("Cannot upload file", e);
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        try {
            String prefix = String.format("%s/storage/v1/object/public/%s/", supabaseUrl, bucketName);
            String objectPath = fileUrl.startsWith(prefix) ? fileUrl.substring(prefix.length()) : null;
            if (objectPath == null || objectPath.isBlank()) {
                log.warn("Cannot extract object path from URL: {}", fileUrl);
                return;
            }
            String endpoint = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, objectPath);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);
            restTemplate.exchange(endpoint, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);
            log.info("Deleted file from Supabase: {}", objectPath);
        } catch (Exception e) {
            log.warn("Could not delete Supabase file (ignored): {} — {}", fileUrl, e.getMessage());
        }
    }
}
