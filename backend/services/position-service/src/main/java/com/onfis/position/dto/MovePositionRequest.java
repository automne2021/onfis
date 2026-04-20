package com.onfis.position.dto;

import java.util.UUID;

public record MovePositionRequest(
        UUID newParentId
) {}
