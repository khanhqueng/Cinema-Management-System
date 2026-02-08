package com.example.cinema.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for seat locking operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatLockResponse {
    private boolean success;
    private List<Long> lockedSeatIds;
    private List<Long> failedSeatIds;
    private String message;

    public boolean hasFailedSeats() {
        return failedSeatIds != null && !failedSeatIds.isEmpty();
    }

    public int getLockedCount() {
        return lockedSeatIds != null ? lockedSeatIds.size() : 0;
    }

    public int getFailedCount() {
        return failedSeatIds != null ? failedSeatIds.size() : 0;
    }
}