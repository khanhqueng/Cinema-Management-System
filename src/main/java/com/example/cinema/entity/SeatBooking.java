package com.example.cinema.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SeatBooking Entity - Individual Seat Reservation
 * Links specific seats to bookings for detailed seat management
 */
@Entity
@Table(name = "seat_bookings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"showtime_id", "seat_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"seat", "showtime", "booking"})
public class SeatBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Seat is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @NotNull(message = "Showtime is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @NotNull(message = "Booking is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status")
    private SeatBookingStatus status = SeatBookingStatus.RESERVED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Utility methods
    public boolean isActive() {
        return SeatBookingStatus.RESERVED.equals(status);
    }

    public boolean isCancelled() {
        return SeatBookingStatus.CANCELLED.equals(status);
    }

    public void cancel() {
        this.status = SeatBookingStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    public String getSeatLabel() {
        return seat != null ? seat.getSeatLabel() : "Unknown Seat";
    }

    public String getMovieTitle() {
        return showtime != null ? showtime.getMovieTitle() : "Unknown Movie";
    }

    public String getUserName() {
        return booking != null ? booking.getUserName() : "Unknown User";
    }

    public String getDisplayInfo() {
        return String.format("Seat %s - %s (%s)",
                getSeatLabel(),
                getMovieTitle(),
                status.getDisplayName());
    }

    // Seat booking status enum
    public enum SeatBookingStatus {
        RESERVED("Reserved"),
        CANCELLED("Cancelled");

        private final String displayName;

        SeatBookingStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}