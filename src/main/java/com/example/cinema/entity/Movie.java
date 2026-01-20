package com.example.cinema.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Movie Entity - Content Management
 * Simplified for university project focusing on essential movie information
 */
@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"showtimes", "reviews"})
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Movie title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    @Column(nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Size(max = 50, message = "Genre cannot exceed 50 characters")
    private String genre;

    @Size(max = 100, message = "Director name cannot exceed 100 characters")
    private String director;

    @Positive(message = "Duration must be positive")
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Size(max = 500, message = "Poster URL cannot exceed 500 characters")
    @Column(name = "poster_url")
    private String posterUrl;

    @Positive(message = "Base price must be positive")
    @Column(name = "price_base", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal priceBase = BigDecimal.valueOf(100000); // Default 100,000 VND

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @OneToMany(mappedBy = "movie", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Showtime> showtimes;

    @OneToMany(mappedBy = "movie", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Review> reviews;

    // Utility methods
    public boolean isCurrentlyShowing() {
        LocalDate now = LocalDate.now();
        return releaseDate != null && !releaseDate.isAfter(now);
    }

    public String getFormattedDuration() {
        if (durationMinutes == null || durationMinutes <= 0) {
            return "N/A";
        }
        int hours = durationMinutes / 60;
        int minutes = durationMinutes % 60;

        if (hours > 0) {
            return String.format("%dh %dm", hours, minutes);
        } else {
            return String.format("%dm", minutes);
        }
    }

    public Double getAverageRating() {
        if (reviews == null || reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    public int getReviewCount() {
        return reviews != null ? reviews.size() : 0;
    }

    public boolean hasActiveShowtimes() {
        if (showtimes == null) return false;
        return showtimes.stream()
                .anyMatch(showtime -> showtime.getShowDatetime().isAfter(LocalDateTime.now()));
    }
}