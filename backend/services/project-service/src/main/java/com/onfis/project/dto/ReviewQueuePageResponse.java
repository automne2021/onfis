package com.onfis.project.dto;

import java.util.List;

public record ReviewQueuePageResponse(
        List<TaskResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
