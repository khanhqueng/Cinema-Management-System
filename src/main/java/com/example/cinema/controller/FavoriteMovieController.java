package com.example.cinema.controller;

import com.example.cinema.entity.FavoriteMovie;
import com.example.cinema.entity.Movie;
import com.example.cinema.entity.User;
import com.example.cinema.service.FavoriteMovieService;
import com.example.cinema.service.MovieService;
import com.example.cinema.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FavoriteMovie Controller - API endpoints for favorite movies management
 * Allows users to manage their favorite movies list
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FavoriteMovieController {

    private final FavoriteMovieService favoriteMovieService;
    private final MovieService movieService;
    private final UserService userService;

    /**
     * Get user's favorite movies
     */
    @GetMapping("/my-favorites")
    public ResponseEntity<Page<FavoriteMovie>> getMyFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "addedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        User currentUser = userService.getCurrentUser();

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FavoriteMovie> favorites = favoriteMovieService.getUserFavorites(currentUser.getId(), pageable);

        return ResponseEntity.ok(favorites);
    }

    /**
     * Get all user's favorite movies (no pagination)
     */
    @GetMapping("/my-favorites/all")
    public ResponseEntity<List<FavoriteMovie>> getAllMyFavorites() {
        User currentUser = userService.getCurrentUser();
        List<FavoriteMovie> favorites = favoriteMovieService.getAllUserFavorites(currentUser.getId());
        return ResponseEntity.ok(favorites);
    }

    /**
     * Add movie to favorites
     */
    @PostMapping("/add/{movieId}")
    public ResponseEntity<FavoriteMovie> addToFavorites(@PathVariable Long movieId) {
        User currentUser = userService.getCurrentUser();
        FavoriteMovie favorite = favoriteMovieService.addToFavorites(currentUser.getId(), movieId);
        return ResponseEntity.ok(favorite);
    }

    /**
     * Remove movie from favorites
     */
    @DeleteMapping("/remove/{movieId}")
    public ResponseEntity<Void> removeFromFavorites(@PathVariable Long movieId) {
        User currentUser = userService.getCurrentUser();
        favoriteMovieService.removeFromFavorites(currentUser.getId(), movieId);
        return ResponseEntity.ok().build();
    }

    /**
     * Toggle movie in favorites
     */
    @PostMapping("/toggle/{movieId}")
    public ResponseEntity<FavoriteMovieService.FavoriteToggleResult> toggleFavorite(@PathVariable Long movieId) {
        User currentUser = userService.getCurrentUser();
        FavoriteMovieService.FavoriteToggleResult result = favoriteMovieService.toggleFavorite(currentUser.getId(), movieId);
        return ResponseEntity.ok(result);
    }

    /**
     * Check if movie is in user's favorites
     */
    @GetMapping("/check/{movieId}")
    public ResponseEntity<FavoriteCheckResponse> checkFavorite(@PathVariable Long movieId) {
        User currentUser = userService.getCurrentUser();
        boolean isFavorite = favoriteMovieService.isMovieInFavorites(currentUser.getId(), movieId);
        return ResponseEntity.ok(new FavoriteCheckResponse(movieId, isFavorite));
    }

    /**
     * Get user's favorite movies by genre
     */
    @GetMapping("/my-favorites/genre/{genre}")
    public ResponseEntity<List<FavoriteMovie>> getFavoritesByGenre(@PathVariable String genre) {
        User currentUser = userService.getCurrentUser();
        List<FavoriteMovie> favorites = favoriteMovieService.getUserFavoritesByGenre(currentUser.getId(), genre);
        return ResponseEntity.ok(favorites);
    }

    /**
     * Get recently added favorites (last 7 days)
     */
    @GetMapping("/my-favorites/recent")
    public ResponseEntity<List<FavoriteMovie>> getRecentFavorites() {
        User currentUser = userService.getCurrentUser();
        List<FavoriteMovie> recentFavorites = favoriteMovieService.getRecentFavorites(currentUser.getId());
        return ResponseEntity.ok(recentFavorites);
    }

    /**
     * Get user's favorite genres (sorted by frequency)
     */
    @GetMapping("/my-favorite-genres")
    public ResponseEntity<List<FavoriteMovieService.GenreCount>> getFavoriteGenres() {
        User currentUser = userService.getCurrentUser();
        List<FavoriteMovieService.GenreCount> genreCounts = favoriteMovieService.getUserFavoriteGenres(currentUser.getId());
        return ResponseEntity.ok(genreCounts);
    }

    /**
     * Get count of user's favorite movies
     */
    @GetMapping("/my-favorites/count")
    public ResponseEntity<FavoriteCountResponse> getFavoritesCount() {
        User currentUser = userService.getCurrentUser();
        long count = favoriteMovieService.getUserFavoritesCount(currentUser.getId());
        return ResponseEntity.ok(new FavoriteCountResponse(count));
    }

    /**
     * Get popular favorite movies (favorited by many users)
     */
    @GetMapping("/popular")
    public ResponseEntity<List<FavoriteMovieService.PopularFavorite>> getPopularFavorites(
            @RequestParam(defaultValue = "5") int minFavorites,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        List<FavoriteMovieService.PopularFavorite> popularFavorites =
            favoriteMovieService.getPopularFavoriteMovies(minFavorites, pageable);

        return ResponseEntity.ok(popularFavorites);
    }

    /**
     * Get movies with favorite status for current user
     */
    @PostMapping("/check-multiple")
    public ResponseEntity<List<FavoriteMovieService.MovieWithFavoriteStatus>> getMoviesWithFavoriteStatus(
            @RequestBody MovieIdsRequest request) {

        User currentUser = userService.getCurrentUser();
        List<Movie> movies = movieService.getMoviesByIds(request.movieIds());

        List<FavoriteMovieService.MovieWithFavoriteStatus> moviesWithStatus =
            favoriteMovieService.getMoviesWithFavoriteStatus(currentUser.getId(), movies);

        return ResponseEntity.ok(moviesWithStatus);
    }

    /**
     * Get favorites statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FavoriteMovieService.FavoritesStatistics> getFavoritesStatistics() {
        FavoriteMovieService.FavoritesStatistics stats = favoriteMovieService.getFavoritesStatistics();
        return ResponseEntity.ok(stats);
    }

    // DTOs
    public record FavoriteCheckResponse(Long movieId, boolean isFavorite) {}

    public record FavoriteCountResponse(long count) {}

    public record MovieIdsRequest(List<Long> movieIds) {}
}