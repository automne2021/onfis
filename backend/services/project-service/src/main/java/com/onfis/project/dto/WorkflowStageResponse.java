package com.onfis.project.dto;

public record WorkflowStageResponse(
        String id,
        String name,
        int stageOrder
) {
}
