package com.onfis.announcement.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Data
public class AnnouncementCreateRequestDTO {
    private String title;
    private String content;
    private String scope; 
    private String status; 
    private Boolean isPinned;
    private String departments; 
    private List<MultipartFile> attachments; 
}