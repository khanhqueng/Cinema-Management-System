package com.example.cinema.service;

import com.example.cinema.entity.Movie;
import com.example.cinema.entity.Showtime;
import com.example.cinema.entity.Theater;
import com.example.cinema.repository.MovieRepository;
import com.example.cinema.repository.ShowtimeRepository;
import com.example.cinema.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Showtime Service - Business Logic for Showtime Management
 * Handles all showtime-related business operations
 */
@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;

    /**
     * Get all showtimes with pagination
     */
    public Page<Showtime> getAllShowtimes(Pageable pageable) {
        return showtimeRepository.findAll(pageable);
    }

    /**
     * Get showtime by ID
     */
    public Optional<Showtime> getShowtimeById(Long id) {
        return showtimeRepository.findById(id);
    }

    /**
     * Get upcoming showtimes
     */
    public Page<Showtime> getUpcomingShowtimes(Pageable pageable) {
        return showtimeRepository.findUpcomingShowtimes(LocalDateTime.now(), pageable);
    }

    /**
     * Get available showtimes (with seats)
     */
    public Page<Showtime> getAvailableShowtimes(Pageable pageable) {
        return showtimeRepository.findAvailableShowtimes(LocalDateTime.now(), pageable);
    }

    /**
     * Get showtimes by movie
     */
    public Page<Showtime> getShowtimesByMovie(Long movieId, Pageable pageable) {
        return showtimeRepository.findByMovieIdOrderByShowDatetime(movieId, pageable);
    }

    /**
     * Get showtimes by theater
     */
    public Page<Showtime> getShowtimesByTheater(Long theaterId, Pageable pageable) {
        return showtimeRepository.findByTheaterIdOrderByShowDatetime(theaterId, pageable);
    }

    /**
     * Get showtimes by date range
     */
    public List<Showtime> getShowtimesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return showtimeRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Get showtimes for specific movie and theater
     */
    public List<Showtime> getShowtimesByMovieAndTheater(Long movieId, Long theaterId) {
        return showtimeRepository.findByMovieAndTheater(movieId, theaterId, LocalDateTime.now());
    }

    /**
     * Get popular showtimes
     */
    public Page<Showtime> getPopularShowtimes(Pageable pageable) {
        return showtimeRepository.findPopularShowtimes(pageable);
    }

    /**
     * Create new showtime
     */
    public ShowtimeResult createShowtime(Long movieId, Long theaterId, LocalDateTime showDatetime, BigDecimal price) {
        Optional<Movie> movie = movieRepository.findById(movieId);
        Optional<Theater> theater = theaterRepository.findById(theaterId);

        if (movie.isEmpty()) {
            return ShowtimeResult.error("Movie not found");
        }
        if (theater.isEmpty()) {
            return ShowtimeResult.error("Theater not found");
        }

        Showtime showtime = Showtime.builder()
                .movie(movie.get())
                .theater(theater.get())
                .showDatetime(showDatetime)
                .price(price)
                .availableSeats(theater.get().getCapacity()) // Initialize with full capacity
                .build();

        Showtime savedShowtime = showtimeRepository.save(showtime);
        return ShowtimeResult.success(savedShowtime);
    }

    /**
     * Update showtime
     */
    public ShowtimeResult updateShowtime(Long id, Long movieId, Long theaterId,
                                       LocalDateTime showDatetime, BigDecimal price) {
        Optional<Showtime> showtimeOpt = showtimeRepository.findById(id);
        if (showtimeOpt.isEmpty()) {
            return ShowtimeResult.error("Showtime not found");
        }

        Showtime showtime = showtimeOpt.get();

        if (movieId != null) {
            Optional<Movie> movie = movieRepository.findById(movieId);
            if (movie.isEmpty()) {
                return ShowtimeResult.error("Movie not found");
            }
            showtime.setMovie(movie.get());
        }

        if (theaterId != null) {
            Optional<Theater> theater = theaterRepository.findById(theaterId);
            if (theater.isEmpty()) {
                return ShowtimeResult.error("Theater not found");
            }
            // Adjust available seats if theater changed
            int bookedSeats = showtime.getCapacity() - showtime.getAvailableSeats();
            showtime.setTheater(theater.get());
            showtime.setAvailableSeats(theater.get().getCapacity() - bookedSeats);
        }

        if (showDatetime != null) {
            showtime.setShowDatetime(showDatetime);
        }
        if (price != null) {
            showtime.setPrice(price);
        }

        Showtime updatedShowtime = showtimeRepository.save(showtime);
        return ShowtimeResult.success(updatedShowtime);
    }

    /**
     * Delete showtime
     */
    public boolean deleteShowtime(Long id) {
        return showtimeRepository.findById(id)
                .map(showtime -> {
                    showtimeRepository.delete(showtime);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Get showtime availability
     */
    public Optional<ShowtimeAvailability> getShowtimeAvailability(Long id) {
        return showtimeRepository.findById(id)
                .map(showtime -> new ShowtimeAvailability(
                    showtime.getAvailableSeats(),
                    showtime.getCapacity(),
                    showtime.getBookedSeats(),
                    showtime.isBookable()
                ));
    }

    /**
     * Get showtime statistics
     */
    public ShowtimeStats getShowtimeStats() {
        long totalShowtimes = showtimeRepository.count();
        long upcomingShowtimes = showtimeRepository.countUpcomingShowtimes(LocalDateTime.now());
        Long totalAvailableSeats = showtimeRepository.getTotalAvailableSeats(LocalDateTime.now());

        return new ShowtimeStats(
            totalShowtimes,
            upcomingShowtimes,
            totalAvailableSeats != null ? totalAvailableSeats : 0L
        );
    }

    /**
     * Check if showtime exists
     */
    public boolean showtimeExists(Long id) {
        return showtimeRepository.existsById(id);
    }

    /**
     * Showtime Result wrapper for error handling
     */
    public static class ShowtimeResult {
        private final Showtime showtime;
        private final String error;
        private final boolean success;

        private ShowtimeResult(Showtime showtime, String error, boolean success) {
            this.showtime = showtime;
            this.error = error;
            this.success = success;
        }

        public static ShowtimeResult success(Showtime showtime) {
            return new ShowtimeResult(showtime, null, true);
        }

        public static ShowtimeResult error(String error) {
            return new ShowtimeResult(null, error, false);
        }

        public boolean isSuccess() { return success; }
        public Showtime getShowtime() { return showtime; }
        public String getError() { return error; }
    }

    /**
     * Showtime Availability DTO
     */
    public record ShowtimeAvailability(
        Integer availableSeats,
        Integer totalCapacity,
        Integer bookedSeats,
        boolean isBookable
    ) {
        public double getOccupancyRate() {
            if (totalCapacity == null || totalCapacity == 0) return 0.0;
            return ((double) bookedSeats / totalCapacity) * 100;
        }
    }

    /**
     * Showtime Statistics DTO
     */
    public record ShowtimeStats(
        long totalShowtimes,
        long upcomingShowtimes,
        long totalAvailableSeats
    ) {}
}