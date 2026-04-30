package com.onfis.project.domain;

public enum GlobalRole {
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    EMPLOYEE;

    /**
     * SUPER_ADMIN, ADMIN, and MANAGER all have manager-level authority in the
     * project module.
     */
    public boolean isManagerLike() {
        return this == SUPER_ADMIN || this == ADMIN || this == MANAGER;
    }

    public static GlobalRole fromDbValue(String value) {
        if (value == null || value.isBlank()) {
            return EMPLOYEE;
        }
        String normalized = value.toUpperCase().replace(" ", "_");
        try {
            return GlobalRole.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return EMPLOYEE;
        }
    }
}
