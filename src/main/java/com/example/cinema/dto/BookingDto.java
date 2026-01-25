package com.example.cinema.dto;

import com.example.cinema.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for Booking entity to avoid Hibernate proxy serialization issues
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {
    private Long id;
    private String bookingReference;
    private Integer seatsBooked;
    private BigDecimal totalAmount;
    private String bookingStatus;
    private LocalDateTime createdAt;

    // Nested DTOs for related entities
    private UserDto user;
    private ShowtimeDto showtime;

    /**
     * Convert Booking entity to DTO
     */
    public static BookingDto fromEntity(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .seatsBooked(booking.getSeatsBooked())
                .totalAmount(booking.getTotalAmount())
                .bookingStatus(booking.getBookingStatus().name())
                .createdAt(booking.getCreatedAt())
                .user(UserDto.fromEntity(booking.getUser()))
                .showtime(ShowtimeDto.fromEntity(booking.getShowtime()))
                .build();
    }

    /**
     * Simple nested DTO for User
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String email;
        private String fullName;

        public static UserDto fromEntity(com.example.cinema.entity.User user) {
            return UserDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .build();
        }
    }
}