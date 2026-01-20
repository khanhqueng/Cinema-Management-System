package com.example.cinema.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Review Entity - User Feedback System
 * Simple review system for movies with rating and optional text
 */
@Entity
@Table(name = "reviews", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"movie_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"movie", "user"})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Movie is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    @Column(nullable = false)
    private Integer rating;

    @Column(name = "review_text")
    private String reviewText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Utility methods
    public boolean hasReviewText() {
        return reviewText != null && !reviewText.trim().isEmpty();
    }

    public String getShortReviewText(int maxLength) {
        if (!hasReviewText()) {
            return "";
        }
        if (reviewText.length() <= maxLength) {
            return reviewText;
        }
        return reviewText.substring(0, maxLength - 3) + "...";
    }

    public boolean isPositiveReview() {
        return rating >= 4;
    }

    public boolean isNegativeReview() {
        return rating <= 2;
    }

    public String getRatingDescription() {
        return switch (rating) {
            case 1 -> "Terrible";
            case 2 -> "Poor";
            case 3 -> "Average";
            case 4 -> "Good";
            case 5 -> "Excellent";
            default -> "Unknown";
        };
    }

    public String getStarDisplay() {
        return "★".repeat(rating) + "☆".repeat(5 - rating);
    }

    public String getMovieTitle() {
        return movie != null ? movie.getTitle() : "Unknown Movie";
    }

    public String getUserName() {
        return user != null ? user.getFullName() : "Anonymous";
    }

    public String getReviewSummary() {
        return String.format("%s - %s (%d/5 stars)",
                getUserName(),
                getMovieTitle(),
                rating);
    }
}