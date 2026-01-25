package com.example.cinema.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Showtime DTO - Transfer Object for Showtime Data
 * Avoids Hibernate proxy serialization issues by using plain data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowtimeDto {

    private Long id;
    private Long movieId;
    private String movieTitle;
    private String moviePosterUrl;
    private Integer movieDurationMinutes;
    private Long theaterId;
    private String theaterName;
    private Integer theaterCapacity;
    private LocalDateTime showDatetime;
    private BigDecimal price;
    private Integer availableSeats;
    private LocalDateTime createdAt;

    // Computed fields
    public LocalDateTime getEndDatetime() {
        if (movieDurationMinutes != null) {
            return showDatetime.plusMinutes(movieDurationMinutes);
        }
        return showDatetime.plusHours(2); // Default 2 hours if duration unknown
    }

    public boolean isUpcoming() {
        return showDatetime.isAfter(LocalDateTime.now());
    }

    public boolean isOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return showDatetime.isBefore(now) && getEndDatetime().isAfter(now);
    }

    public boolean isFinished() {
        return getEndDatetime().isBefore(LocalDateTime.now());
    }

    public boolean isBookable() {
        return isUpcoming() && availableSeats > 0;
    }

    public Integer getBookedSeats() {
        return theaterCapacity != null ? theaterCapacity - availableSeats : 0;
    }

    public Double getOccupancyRate() {
        if (theaterCapacity == null || theaterCapacity == 0) return 0.0;
        return ((double) getBookedSeats() / theaterCapacity) * 100;
    }

    public boolean canBook(int requestedSeats) {
        return isBookable() && availableSeats >= requestedSeats;
    }

    public String getShowtimeDisplay() {
        return movieTitle + " - " + theaterName + " at " + showDatetime;
    }

    /**
     * Convert Showtime entity to DTO
     */
    public static ShowtimeDto fromEntity(com.example.cinema.entity.Showtime showtime) {
        return ShowtimeDto.builder()
                .id(showtime.getId())
                .movieId(showtime.getMovie() != null ? showtime.getMovie().getId() : null)
                .movieTitle(showtime.getMovieTitle())
                .moviePosterUrl(showtime.getMovie() != null ? showtime.getMovie().getPosterUrl() : null)
                .movieDurationMinutes(showtime.getMovie() != null ? showtime.getMovie().getDurationMinutes() : null)
                .theaterId(showtime.getTheater() != null ? showtime.getTheater().getId() : null)
                .theaterName(showtime.getTheaterName())
                .theaterCapacity(showtime.getCapacity())
                .showDatetime(showtime.getShowDatetime())
                .price(showtime.getPrice())
                .availableSeats(showtime.getAvailableSeats())
                .createdAt(showtime.getCreatedAt())
                .build();
    }
}