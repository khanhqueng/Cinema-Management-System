package com.example.cinema.service;

import com.example.cinema.entity.FavoriteMovie;
import com.example.cinema.entity.Movie;
import com.example.cinema.entity.User;
import com.example.cinema.exception.BusinessRuleViolationException;
import com.example.cinema.exception.ResourceNotFoundException;
import com.example.cinema.repository.FavoriteMovieRepository;
import com.example.cinema.repository.MovieRepository;
import com.example.cinema.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * FavoriteMovie Service - Business Logic for Favorite Movies Management
 * Handles user's favorite movies operations
 */
@Service
@RequiredArgsConstructor
public class FavoriteMovieService {

    private final FavoriteMovieRepository favoriteMovieRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    /**
     * Add movie to user's favorites
     */
    @Transactional
    public FavoriteMovie addToFavorites(Long userId, Long movieId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", movieId));

        // Check if already in favorites
        if (favoriteMovieRepository.existsByUserAndMovie(user, movie)) {
            throw new BusinessRuleViolationException("Movie is already in your favorites");
        }

        FavoriteMovie favoriteMovie = FavoriteMovie.builder()
                .user(user)
                .movie(movie)
                .build();

        return favoriteMovieRepository.save(favoriteMovie);
    }

    /**
     * Remove movie from user's favorites
     */
    @Transactional
    public void removeFromFavorites(Long userId, Long movieId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", movieId));

        favoriteMovieRepository.deleteByUserAndMovie(user, movie);
    }

    /**
     * Check if movie is in user's favorites
     */
    public boolean isMovieInFavorites(Long userId, Long movieId) {
        return favoriteMovieRepository.existsByUserIdAndMovieId(userId, movieId);
    }

    /**
     * Get user's favorite movies with pagination
     */
    public Page<FavoriteMovie> getUserFavorites(Long userId, Pageable pageable) {
        return favoriteMovieRepository.findByUserIdWithMoviePage(userId, pageable);
    }

    /**
     * Get user's favorite movies (all)
     */
    public List<FavoriteMovie> getAllUserFavorites(Long userId) {
        return favoriteMovieRepository.findByUserIdWithMovie(userId);
    }

    /**
     * Get user's favorite movies by genre
     */
    public List<FavoriteMovie> getUserFavoritesByGenre(Long userId, String genre) {
        return favoriteMovieRepository.findByUserIdAndGenre(userId, genre);
    }

    /**
     * Get user's recently added favorites (last 7 days)
     */
    public List<FavoriteMovie> getRecentFavorites(Long userId) {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        return favoriteMovieRepository.findRecentFavorites(userId, weekAgo);
    }

    /**
     * Get user's favorite genres (sorted by frequency)
     */
    public List<GenreCount> getUserFavoriteGenres(Long userId) {
        List<Object[]> results = favoriteMovieRepository.getUserFavoriteGenres(userId);
        return results.stream()
                .map(row -> new GenreCount((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    /**
     * Get count of user's favorite movies
     */
    public long getUserFavoritesCount(Long userId) {
        return favoriteMovieRepository.countByUserId(userId);
    }

    /**
     * Get popular favorite movies (favorited by many users)
     */
    public List<PopularFavorite> getPopularFavoriteMovies(int minFavorites, Pageable pageable) {
        List<Object[]> results = favoriteMovieRepository.findPopularFavoriteMovies(minFavorites, pageable);
        return results.stream()
                .map(row -> new PopularFavorite((Movie) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    /**
     * Toggle movie in favorites (add if not present, remove if present)
     */
    @Transactional
    public FavoriteToggleResult toggleFavorite(Long userId, Long movieId) {
        if (isMovieInFavorites(userId, movieId)) {
            removeFromFavorites(userId, movieId);
            return new FavoriteToggleResult(false, "Movie removed from favorites");
        } else {
            FavoriteMovie favorite = addToFavorites(userId, movieId);
            return new FavoriteToggleResult(true, "Movie added to favorites", favorite);
        }
    }

    /**
     * Get movies with favorite status for user
     */
    public List<MovieWithFavoriteStatus> getMoviesWithFavoriteStatus(Long userId, List<Movie> movies) {
        List<Long> movieIds = movies.stream().map(Movie::getId).collect(Collectors.toList());

        // Get user's favorites for these movies
        List<FavoriteMovie> userFavorites = favoriteMovieRepository.findByUserIdWithMovie(userId);
        Map<Long, Boolean> favoriteMap = userFavorites.stream()
                .collect(Collectors.toMap(
                    fm -> fm.getMovie().getId(),
                    fm -> true
                ));

        return movies.stream()
                .map(movie -> new MovieWithFavoriteStatus(movie, favoriteMap.getOrDefault(movie.getId(), false)))
                .collect(Collectors.toList());
    }

    /**
     * Get favorites statistics (Admin only)
     */
    public FavoritesStatistics getFavoritesStatistics() {
        Long totalUsers = favoriteMovieRepository.getTotalUsersWithFavorites();
        Long totalFavorites = favoriteMovieRepository.getTotalFavoritesCount();

        // Calculate average favorites per user
        double avgFavoritesPerUser = 0.0;
        if (totalUsers != null && totalUsers > 0 && totalFavorites != null) {
            List<Long> userFavoriteCounts = favoriteMovieRepository.getUserFavoriteCounts();
            if (!userFavoriteCounts.isEmpty()) {
                double sum = userFavoriteCounts.stream().mapToLong(Long::longValue).sum();
                avgFavoritesPerUser = sum / userFavoriteCounts.size();
            }
        }

        return new FavoritesStatistics(
            totalUsers != null ? totalUsers : 0L,
            totalFavorites != null ? totalFavorites : 0L,
            avgFavoritesPerUser
        );
    }

    // DTOs
    public record GenreCount(String genre, long count) {}

    public record PopularFavorite(Movie movie, long favoriteCount) {}

    public record FavoriteToggleResult(boolean isFavorite, String message, FavoriteMovie favoriteMovie) {
        public FavoriteToggleResult(boolean isFavorite, String message) {
            this(isFavorite, message, null);
        }
    }

    public record MovieWithFavoriteStatus(Movie movie, boolean isFavorite) {}

    public record FavoritesStatistics(long totalUsers, long totalFavorites, double avgFavoritesPerUser) {}
}