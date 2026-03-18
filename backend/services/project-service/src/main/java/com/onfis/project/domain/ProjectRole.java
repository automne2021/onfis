package com.onfis.project.domain;

public enum ProjectRole {
    LEAD,
    DEVELOPER,
    DESIGNER,
    QA,
    ANALYST,
    MEMBER;

    public static ProjectRole fromDbValue(String value) {
        if (value == null || value.isBlank()) {
            return MEMBER;
        }
        return ProjectRole.valueOf(value.toUpperCase());
    }
}
