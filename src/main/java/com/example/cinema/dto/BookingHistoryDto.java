package com.example.cinema.dto;

import com.example.cinema.entity.Booking;
import com.example.cinema.entity.SeatBooking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO for user booking history — combines Booking + its SeatBookings in one payload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingHistoryDto {

    private Long id;
    private String bookingReference;
    private Integer seatsBooked;
    private BigDecimal totalAmount;
    private String bookingStatus;
    private LocalDateTime createdAt;
    /** True if the booking can still be cancelled (confirmed + upcoming showtime). */
    private boolean canCancel;
    private ShowtimeDto showtime;
    private List<SeatBookingDto> seatBookings;

    public static BookingHistoryDto fromEntity(Booking booking, List<SeatBooking> seats) {
        List<SeatBookingDto> seatDtos = seats.stream()
                .map(SeatBookingDto::fromEntity)
                .collect(Collectors.toList());

        return BookingHistoryDto.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .seatsBooked(booking.getSeatsBooked())
                .totalAmount(booking.getTotalAmount())
                .bookingStatus(booking.getBookingStatus().name())
                .createdAt(booking.getCreatedAt())
                .canCancel(booking.canBeCancelled())
                .showtime(ShowtimeDto.fromEntity(booking.getShowtime()))
                .seatBookings(seatDtos)
                .build();
    }
}
