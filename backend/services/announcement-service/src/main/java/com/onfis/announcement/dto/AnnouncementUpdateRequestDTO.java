package com.onfis.announcement.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Request DTO for updating an existing announcement.
 * - existingAttachmentIds: IDs of current attachments to KEEP (omitted IDs will
 * be removed).
 * - newAttachments: additional files to upload and attach.
 */
@Data
public class AnnouncementUpdateRequestDTO {
    private String title;
    private String content;
    private String scope;
    private Boolean isPinned;
    /** JSON array of department UUID strings, e.g. "[\"uuid1\"]" */
    private String departments;
    /** UUIDs of existing attachments to retain */
    private List<String> existingAttachmentIds;
    /** New files to upload */
    private List<MultipartFile> newAttachments;
}
