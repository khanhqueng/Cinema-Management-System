package com.example.cinema.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Theater Entity - Venue Management
 * Simplified theater management focusing on capacity and basic info
 */
@Entity
@Table(name = "theaters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"showtimes"})
public class Theater {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Theater name is required")
    @Size(max = 100, message = "Theater name cannot exceed 100 characters")
    @Column(nullable = false)
    private String name;

    @Positive(message = "Capacity must be positive")
    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "theater_type")
    private TheaterType theaterType = TheaterType.STANDARD;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @OneToMany(mappedBy = "theater", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Showtime> showtimes;

    // Utility methods
    public boolean isVip() {
        return TheaterType.VIP.equals(this.theaterType);
    }

    public String getDisplayName() {
        return name + " (" + capacity + " seats)";
    }

    public boolean hasActiveShowtimes() {
        if (showtimes == null) return false;
        return showtimes.stream()
                .anyMatch(showtime -> showtime.getShowDatetime().isAfter(LocalDateTime.now()));
    }

    public long getCurrentOccupiedSeats() {
        if (showtimes == null) return 0;
        return showtimes.stream()
                .filter(showtime -> showtime.getShowDatetime().isAfter(LocalDateTime.now()))
                .mapToLong(showtime -> showtime.getCapacity() - showtime.getAvailableSeats())
                .sum();
    }

    // Theater type enum
    public enum TheaterType {
        STANDARD("Standard Theater"),
        VIP("VIP Theater");

        private final String displayName;

        TheaterType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}