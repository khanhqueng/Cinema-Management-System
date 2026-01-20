package com.example.cinema.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seat Entity - Individual Seat Management
 * Represents physical seats in a theater with row and column positioning
 */
@Entity
@Table(name = "seats",
       uniqueConstraints = @UniqueConstraint(columnNames = {"theater_id", "row_letter", "seat_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"theater", "seatBookings"})
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Theater is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theater_id", nullable = false)
    private Theater theater;

    @NotNull(message = "Row letter is required")
    @Size(min = 1, max = 2, message = "Row letter must be 1-2 characters")
    @Column(name = "row_letter", nullable = false, length = 2)
    private String rowLetter;

    @Positive(message = "Seat number must be positive")
    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "seat_type")
    private SeatType seatType = SeatType.STANDARD;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @OneToMany(mappedBy = "seat", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<SeatBooking> seatBookings;

    // Utility methods
    public String getSeatLabel() {
        return rowLetter + seatNumber;
    }

    public boolean isVip() {
        return SeatType.VIP.equals(this.seatType);
    }

    public boolean isWheelchairAccessible() {
        return SeatType.WHEELCHAIR.equals(this.seatType);
    }

    public boolean isBookableForShowtime(Long showtimeId) {
        if (!isActive || seatBookings == null) {
            return isActive;
        }

        return seatBookings.stream()
                .noneMatch(booking -> booking.getShowtime().getId().equals(showtimeId)
                          && booking.isActive());
    }

    public String getDisplayName() {
        return getSeatLabel() + " (" + seatType.getDisplayName() + ")";
    }

    // Seat type enum
    public enum SeatType {
        STANDARD("Standard", 1.0),
        VIP("VIP", 1.5),
        COUPLE("Couple", 1.3),
        WHEELCHAIR("Wheelchair", 1.0);

        private final String displayName;
        private final Double priceMultiplier;

        SeatType(String displayName, Double priceMultiplier) {
            this.displayName = displayName;
            this.priceMultiplier = priceMultiplier;
        }

        public String getDisplayName() {
            return displayName;
        }

        public Double getPriceMultiplier() {
            return priceMultiplier;
        }
    }
}