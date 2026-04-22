package com.onfis.chat.dto;

import lombok.Builder;
import lombok.Data;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class MeetingDTO {
    private UUID id;
    private UUID hostId;
    private String type;         // "VIDEO" hoặc "AUDIO"
    private String status;       // "ONGOING" (Đang diễn ra) hoặc "ENDED" (Đã kết thúc)
    private ZonedDateTime startTime;
    private ZonedDateTime endTime;
    private String meetingLink;  // Room ID để SDK kết nối (VD: LiveKit Room)
}