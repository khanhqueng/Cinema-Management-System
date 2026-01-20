package com.example.cinema.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * FavoriteMovie Entity - User's Favorite Movies
 * Manages the many-to-many relationship between users and their favorite movies
 */
@Entity
@Table(name = "favorite_movies",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "movie_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "movie"})
public class FavoriteMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Movie is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;

    // Utility methods
    public String getMovieTitle() {
        return movie != null ? movie.getTitle() : "Unknown Movie";
    }

    public String getUserName() {
        return user != null ? user.getFullName() : "Unknown User";
    }

    public String getUserEmail() {
        return user != null ? user.getEmail() : "Unknown Email";
    }

    public String getMovieGenre() {
        return movie != null ? movie.getGenre() : "Unknown Genre";
    }

    public Integer getMovieYear() {
        return movie != null && movie.getReleaseDate() != null
            ? movie.getReleaseDate().getYear()
            : null;
    }

    public String getDisplayInfo() {
        return String.format("%s added '%s' to favorites on %s",
                getUserName(),
                getMovieTitle(),
                addedAt != null ? addedAt.toLocalDate() : "Unknown Date");
    }

    public boolean isRecentlyAdded() {
        return addedAt != null && addedAt.isAfter(LocalDateTime.now().minusDays(7));
    }
}