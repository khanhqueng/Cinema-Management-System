package com.example.cinema.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * UserGenrePreference Entity - User's Movie Genre Preferences
 * Manages user's preferred movie genres with preference scores
 */
@Entity
@Table(name = "user_genre_preferences",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "genre"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user"})
public class UserGenrePreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Genre is required")
    @Column(nullable = false, length = 50)
    private String genre;

    @Min(value = 1, message = "Preference score must be at least 1")
    @Max(value = 5, message = "Preference score cannot exceed 5")
    @Builder.Default
    @Column(name = "preference_score")
    private Integer preferenceScore = 3; // Default neutral preference

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
    public boolean isHighPreference() {
        return preferenceScore != null && preferenceScore >= 4;
    }

    public boolean isLowPreference() {
        return preferenceScore != null && preferenceScore <= 2;
    }

    public boolean isNeutralPreference() {
        return preferenceScore != null && preferenceScore == 3;
    }

    public String getPreferenceLevel() {
        if (preferenceScore == null) return "Unknown";
        return switch (preferenceScore) {
            case 1 -> "Very Low";
            case 2 -> "Low";
            case 3 -> "Neutral";
            case 4 -> "High";
            case 5 -> "Very High";
            default -> "Unknown";
        };
    }

    public String getUserName() {
        return user != null ? user.getFullName() : "Unknown User";
    }

    public String getDisplayInfo() {
        return String.format("%s: %s (%s)",
                genre,
                getPreferenceLevel(),
                preferenceScore + "/5");
    }

    public boolean isRecentlyUpdated() {
        return updatedAt != null && updatedAt.isAfter(LocalDateTime.now().minusDays(30));
    }

    // Helper method to normalize genre name
    public void setGenre(String genre) {
        this.genre = genre != null ? genre.trim() : null;
    }

    // Increment preference score (up to max 5)
    public void incrementPreference() {
        if (preferenceScore == null) preferenceScore = 3;
        if (preferenceScore < 5) {
            preferenceScore++;
            updatedAt = LocalDateTime.now();
        }
    }

    // Decrement preference score (down to min 1)
    public void decrementPreference() {
        if (preferenceScore == null) preferenceScore = 3;
        if (preferenceScore > 1) {
            preferenceScore--;
            updatedAt = LocalDateTime.now();
        }
    }
}