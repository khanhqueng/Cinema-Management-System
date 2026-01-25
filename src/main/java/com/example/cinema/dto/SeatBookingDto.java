package com.example.cinema.dto;

import com.example.cinema.entity.SeatBooking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for SeatBooking entity to avoid Hibernate proxy serialization issues
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatBookingDto {
    private Long id;
    private String seatLabel;
    private String seatType;

    /**
     * Convert SeatBooking entity to DTO
     */
    public static SeatBookingDto fromEntity(SeatBooking seatBooking) {
        return SeatBookingDto.builder()
                .id(seatBooking.getId())
                .seatLabel(seatBooking.getSeatLabel())
                .seatType(seatBooking.getSeat().getSeatType().name())
                .build();
    }
}