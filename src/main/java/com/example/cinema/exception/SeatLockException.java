package com.example.cinema.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when seats cannot be locked/reserved
 * Returns HTTP 409 Conflict status
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class SeatLockException extends RuntimeException {

    public SeatLockException(String message) {
        super(message);
    }

    public SeatLockException(String message, Throwable cause) {
        super(message, cause);
    }
}