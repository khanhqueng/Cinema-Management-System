package com.example.cinema.controller;

import com.example.cinema.dto.MovieResponseDto;
import com.example.cinema.entity.Movie;
import com.example.cinema.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Movie Controller - CRUD Operations for Movie Management
 * Provides comprehensive movie management endpoints with proper authorization
 * Uses MovieService for business logic separation
 */
@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MovieController {

    private final MovieService movieService;

    /**
     * Get all movies with pagination and sorting (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping
    public ResponseEntity<Page<MovieResponseDto>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MovieResponseDto> movies = movieService.getAllMoviesDto(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movie by ID (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/{id}")
    public ResponseEntity<MovieResponseDto> getMovieById(@PathVariable Long id) {
        MovieResponseDto movie = movieService.getMovieDtoById(id);
        return ResponseEntity.ok(movie);
    }

    /**
     * Search movies by title, director, or genre (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/search")
    public ResponseEntity<Page<MovieResponseDto>> searchMovies(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<MovieResponseDto> movies = movieService.searchMoviesDto(query, pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get currently showing movies (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/currently-showing")
    public ResponseEntity<Page<MovieResponseDto>> getCurrentlyShowingMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").descending());
        Page<MovieResponseDto> movies = movieService.getCurrentlyShowingMoviesDto(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get upcoming movies (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/upcoming")
    public ResponseEntity<Page<MovieResponseDto>> getUpcomingMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").ascending());
        Page<MovieResponseDto> movies = movieService.getUpcomingMoviesDto(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movies by genre (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/genre/{genre}")
    public ResponseEntity<Page<MovieResponseDto>> getMoviesByGenre(
            @PathVariable String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<MovieResponseDto> movies = movieService.getMoviesByGenreDto(genre, pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get popular movies (by booking count) (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/popular")
    public ResponseEntity<Page<MovieResponseDto>> getPopularMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<MovieResponseDto> movies = movieService.getPopularMoviesDto(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movies with active showtimes (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/with-showtimes")
    public ResponseEntity<Page<MovieResponseDto>> getMoviesWithShowtimes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<MovieResponseDto> movies = movieService.getMoviesWithShowtimesDto(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get all genres
     */
    @GetMapping("/genres")
    public ResponseEntity<List<String>> getAllGenres() {
        List<String> genres = movieService.getAllGenres();
        return ResponseEntity.ok(genres);
    }

    /**
     * Create new movie (Admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Movie> createMovie(@Valid @RequestBody Movie movie) {
        Movie savedMovie = movieService.createMovie(movie);
        return ResponseEntity.ok(savedMovie);
    }

    /**
     * Update movie (Admin only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Movie> updateMovie(@PathVariable Long id, @Valid @RequestBody Movie movieDetails) {
        Movie updatedMovie = movieService.updateMovieOrThrow(id, movieDetails);
        return ResponseEntity.ok(updatedMovie);
    }

    /**
     * Delete movie (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovieOrThrow(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Get movie statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieService.MovieStats> getMovieStats() {
        MovieService.MovieStats stats = movieService.getMovieStats();
        return ResponseEntity.ok(stats);
    }

    // ================================
    // Enhanced endpoints with computed fields
    // ================================

    /**
     * Get all movies with computed fields (ratings, review counts)
     * Enhanced version that matches frontend expectations
     */
    @GetMapping("/enhanced")
    public ResponseEntity<Page<MovieResponseDto>> getAllMoviesEnhanced(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MovieResponseDto> movies = movieService.getAllMoviesWithDetails(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movie by ID with computed fields
     */
    @GetMapping("/{id}/enhanced")
    public ResponseEntity<MovieResponseDto> getMovieByIdEnhanced(@PathVariable Long id) {
        MovieResponseDto movie = movieService.getMovieByIdWithDetails(id);
        return ResponseEntity.ok(movie);
    }

    /**
     * Get currently showing movies with computed fields
     */
    @GetMapping("/currently-showing/enhanced")
    public ResponseEntity<Page<MovieResponseDto>> getCurrentlyShowingMoviesEnhanced(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").descending());
        Page<MovieResponseDto> movies = movieService.getCurrentlyShowingMoviesWithDetails(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Search movies with computed fields
     */
    @GetMapping("/search/enhanced")
    public ResponseEntity<Page<MovieResponseDto>> searchMoviesEnhanced(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<MovieResponseDto> movies = movieService.searchMoviesWithDetails(query, pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movies by genre with computed fields
     */
    @GetMapping("/genre/{genre}/enhanced")
    public ResponseEntity<Page<MovieResponseDto>> getMoviesByGenreEnhanced(
            @PathVariable String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<MovieResponseDto> movies = movieService.getMoviesByGenreWithDetails(genre, pageable);

        return ResponseEntity.ok(movies);
    }
}