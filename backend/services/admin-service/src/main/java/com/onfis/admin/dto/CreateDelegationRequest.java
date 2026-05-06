package com.onfis.admin.dto;

import java.util.List;

public record CreateDelegationRequest(
        String title,
        String description,
        String priority,
        List<String> assigneeIds) {
}
