package com.onfis.project.domain;

public enum GlobalRole {
    MANAGER,
    EMPLOYEE;

    public static GlobalRole fromDbValue(String value) {
        if (value == null || value.isBlank()) {
            return EMPLOYEE;
        }
        return GlobalRole.valueOf(value.toUpperCase());
    }
}
