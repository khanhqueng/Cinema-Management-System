package com.example.cinema.controller;

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
     * Get all movies with pagination and sorting
     */
    @GetMapping
    public ResponseEntity<Page<Movie>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Movie> movies = movieService.getAllMovies(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movie by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        Movie movie = movieService.getMovieByIdOrThrow(id);
        return ResponseEntity.ok(movie);
    }

    /**
     * Search movies by title, director, or genre
     */
    @GetMapping("/search")
    public ResponseEntity<Page<Movie>> searchMovies(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<Movie> movies = movieService.searchMovies(query, pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get currently showing movies
     */
    @GetMapping("/currently-showing")
    public ResponseEntity<Page<Movie>> getCurrentlyShowingMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").descending());
        Page<Movie> movies = movieService.getCurrentlyShowingMovies(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get upcoming movies
     */
    @GetMapping("/upcoming")
    public ResponseEntity<Page<Movie>> getUpcomingMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").ascending());
        Page<Movie> movies = movieService.getUpcomingMovies(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movies by genre
     */
    @GetMapping("/genre/{genre}")
    public ResponseEntity<Page<Movie>> getMoviesByGenre(
            @PathVariable String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<Movie> movies = movieService.getMoviesByGenre(genre, pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get popular movies (by booking count)
     */
    @GetMapping("/popular")
    public ResponseEntity<Page<Movie>> getPopularMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Movie> movies = movieService.getPopularMovies(pageable);

        return ResponseEntity.ok(movies);
    }

    /**
     * Get movies with active showtimes
     */
    @GetMapping("/with-showtimes")
    public ResponseEntity<Page<Movie>> getMoviesWithShowtimes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<Movie> movies = movieService.getMoviesWithShowtimes(pageable);

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
}