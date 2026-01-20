package com.example.cinema.service;

import com.example.cinema.entity.Movie;
import com.example.cinema.exception.ResourceNotFoundException;
import com.example.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Movie Service - Business Logic for Movie Management
 * Handles all movie-related business operations
 */
@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    /**
     * Get all movies with pagination
     */
    public Page<Movie> getAllMovies(Pageable pageable) {
        return movieRepository.findAll(pageable);
    }

    /**
     * Get movie by ID
     */
    public Optional<Movie> getMovieById(Long id) {
        return movieRepository.findById(id);
    }

    /**
     * Get movie by ID or throw exception
     */
    public Movie getMovieByIdOrThrow(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", "id", id));
    }

    /**
     * Search movies by query
     */
    public Page<Movie> searchMovies(String query, Pageable pageable) {
        return movieRepository.searchMovies(query, pageable);
    }

    /**
     * Get currently showing movies
     */
    public Page<Movie> getCurrentlyShowingMovies(Pageable pageable) {
        return movieRepository.findCurrentlyShowing(LocalDate.now(), pageable);
    }

    /**
     * Get upcoming movies
     */
    public Page<Movie> getUpcomingMovies(Pageable pageable) {
        return movieRepository.findUpcoming(LocalDate.now(), pageable);
    }

    /**
     * Get movies by genre
     */
    public Page<Movie> getMoviesByGenre(String genre, Pageable pageable) {
        return movieRepository.findByGenreIgnoreCase(genre, pageable);
    }

    /**
     * Get popular movies
     */
    public Page<Movie> getPopularMovies(Pageable pageable) {
        return movieRepository.findPopularMovies(pageable);
    }

    /**
     * Get movies with active showtimes
     */
    public Page<Movie> getMoviesWithShowtimes(Pageable pageable) {
        return movieRepository.findMoviesWithActiveShowtimes(pageable);
    }

    /**
     * Get all genres
     */
    public List<String> getAllGenres() {
        return movieRepository.findAllGenres();
    }

    /**
     * Create new movie
     */
    public Movie createMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    /**
     * Update movie
     */
    public Optional<Movie> updateMovie(Long id, Movie movieDetails) {
        return movieRepository.findById(id)
                .map(movie -> {
                    movie.setTitle(movieDetails.getTitle());
                    movie.setDescription(movieDetails.getDescription());
                    movie.setGenre(movieDetails.getGenre());
                    movie.setDirector(movieDetails.getDirector());
                    movie.setDurationMinutes(movieDetails.getDurationMinutes());
                    movie.setReleaseDate(movieDetails.getReleaseDate());
                    movie.setPosterUrl(movieDetails.getPosterUrl());
                    movie.setPriceBase(movieDetails.getPriceBase());

                    return movieRepository.save(movie);
                });
    }

    /**
     * Update movie or throw exception
     */
    public Movie updateMovieOrThrow(Long id, Movie movieDetails) {
        Movie movie = getMovieByIdOrThrow(id);

        movie.setTitle(movieDetails.getTitle());
        movie.setDescription(movieDetails.getDescription());
        movie.setGenre(movieDetails.getGenre());
        movie.setDirector(movieDetails.getDirector());
        movie.setDurationMinutes(movieDetails.getDurationMinutes());
        movie.setReleaseDate(movieDetails.getReleaseDate());
        movie.setPosterUrl(movieDetails.getPosterUrl());
        movie.setPriceBase(movieDetails.getPriceBase());

        return movieRepository.save(movie);
    }

    /**
     * Delete movie
     */
    public boolean deleteMovie(Long id) {
        return movieRepository.findById(id)
                .map(movie -> {
                    movieRepository.delete(movie);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Delete movie or throw exception
     */
    public void deleteMovieOrThrow(Long id) {
        Movie movie = getMovieByIdOrThrow(id);
        movieRepository.delete(movie);
    }

    /**
     * Get movie statistics
     */
    public MovieStats getMovieStats() {
        long totalMovies = movieRepository.count();
        long currentlyShowing = movieRepository.findCurrentlyShowing(LocalDate.now(), Pageable.unpaged()).getTotalElements();
        long upcoming = movieRepository.findUpcoming(LocalDate.now(), Pageable.unpaged()).getTotalElements();

        return new MovieStats(totalMovies, currentlyShowing, upcoming);
    }

    /**
     * Check if movie exists
     */
    public boolean movieExists(Long id) {
        return movieRepository.existsById(id);
    }

    /**
     * Get movies by list of IDs
     */
    public List<Movie> getMoviesByIds(List<Long> movieIds) {
        return movieRepository.findAllById(movieIds);
    }

    /**
     * Movie Statistics DTO
     */
    public record MovieStats(long totalMovies, long currentlyShowing, long upcomingMovies) {}
}