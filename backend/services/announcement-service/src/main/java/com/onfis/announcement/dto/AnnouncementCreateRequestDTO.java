package com.onfis.announcement.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;
@Data
public class AnnouncementCreateRequestDTO {
    private UUID id;
    private String title;
    private String content;
    private String scope; 
    private String status; 
    private Boolean isPinned;
    private String departments; 
    private List<MultipartFile> attachments; 
}