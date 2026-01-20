package com.example.cinema.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Showtime Entity - Schedule Management
 * Core entity for managing movie showtimes with simplified seat tracking
 */
@Entity
@Table(name = "showtimes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"movie", "theater", "bookings"})
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Movie is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @NotNull(message = "Theater is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theater_id", nullable = false)
    private Theater theater;

    @NotNull(message = "Show datetime is required")
    @Column(name = "show_datetime", nullable = false)
    private LocalDateTime showDatetime;

    @Positive(message = "Price must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @PositiveOrZero(message = "Available seats cannot be negative")
    @Column(name = "available_seats", nullable = false)
    private Integer availableSeats;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @OneToMany(mappedBy = "showtime", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Booking> bookings;

    // Utility methods
    public LocalDateTime getEndDatetime() {
        if (movie != null && movie.getDurationMinutes() != null) {
            return showDatetime.plusMinutes(movie.getDurationMinutes());
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

    public Integer getCapacity() {
        return theater != null ? theater.getCapacity() : 0;
    }

    public Integer getBookedSeats() {
        Integer capacity = getCapacity();
        return capacity - availableSeats;
    }

    public Double getOccupancyRate() {
        Integer capacity = getCapacity();
        if (capacity == 0) return 0.0;
        return ((double) getBookedSeats() / capacity) * 100;
    }

    public boolean canBook(int requestedSeats) {
        return isBookable() && availableSeats >= requestedSeats;
    }

    public String getMovieTitle() {
        return movie != null ? movie.getTitle() : "Unknown Movie";
    }

    public String getTheaterName() {
        return theater != null ? theater.getName() : "Unknown Theater";
    }

    public String getShowtimeDisplay() {
        return getMovieTitle() + " - " + getTheaterName() + " at " + showDatetime;
    }
}