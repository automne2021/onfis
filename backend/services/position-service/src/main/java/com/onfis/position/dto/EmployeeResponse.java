package com.onfis.position.dto;

public record EmployeeResponse(
                String id,
                String positionId,
                String name,
                String avatar,
                String workPhone,
                String workEmail,
                String jobPosition,
                String level,
                String role,
                ManagerInfo manager,
                boolean isVacant) {
        public record ManagerInfo(
                        String id,
                        String name,
                        String avatar) {
        }
}
