package com.onfis.position.dto;

import java.util.UUID;

public record AssignUserRequest(
                UUID userId,
                // "unassign" | "remove" | null — what to do with the existing occupant
                String displacedAction) {
}
