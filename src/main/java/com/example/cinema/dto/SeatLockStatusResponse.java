package com.example.cinema.dto;

import java.util.List;

/**
 * Response DTO for seat lock status queries.
 * Used by the frontend to recover payment timer after page reload.
 */
public record SeatLockStatusResponse(
        boolean locked,
        long remainingMs,
        List<Long> seatIds
) {}
