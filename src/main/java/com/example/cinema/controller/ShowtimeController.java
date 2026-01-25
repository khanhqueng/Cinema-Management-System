package com.example.cinema.controller;

import com.example.cinema.dto.ShowtimeDto;
import com.example.cinema.entity.Movie;
import com.example.cinema.entity.Showtime;
import com.example.cinema.entity.Theater;
import com.example.cinema.repository.MovieRepository;
import com.example.cinema.repository.ShowtimeRepository;
import com.example.cinema.repository.TheaterRepository;
import com.example.cinema.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Showtime Controller - CRUD Operations for Showtime Management
 * Provides comprehensive showtime management endpoints with proper authorization
 */
@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShowtimeController {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final ShowtimeService showtimeService;

    /**
     * Get all showtimes with pagination and sorting (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping
    public ResponseEntity<Page<ShowtimeDto>> getAllShowtimes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "showDatetime") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ShowtimeDto> showtimes = showtimeService.getAllShowtimesDto(pageable);

        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get showtime by ID (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeDto> getShowtimeById(@PathVariable Long id) {
        Optional<ShowtimeDto> showtime = showtimeService.getShowtimeDtoById(id);
        return showtime.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get upcoming showtimes (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/upcoming")
    public ResponseEntity<Page<ShowtimeDto>> getUpcomingShowtimes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("showDatetime").ascending());
        Page<ShowtimeDto> showtimes = showtimeService.getUpcomingShowtimesDto(pageable);

        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get available showtimes (with seats) (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/available")
    public ResponseEntity<Page<ShowtimeDto>> getAvailableShowtimes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("showDatetime").ascending());
        Page<ShowtimeDto> showtimes = showtimeService.getAvailableShowtimesDto(pageable);

        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get showtimes by movie (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<Page<ShowtimeDto>> getShowtimesByMovie(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("showDatetime").ascending());
        Page<ShowtimeDto> showtimes = showtimeService.getShowtimesDtoByMovie(movieId, pageable);

        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get showtimes by theater (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/theater/{theaterId}")
    public ResponseEntity<Page<ShowtimeDto>> getShowtimesByTheater(
            @PathVariable Long theaterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("showDatetime").ascending());
        Page<ShowtimeDto> showtimes = showtimeService.getShowtimesDtoByTheater(theaterId, pageable);

        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get showtimes by date range (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<ShowtimeDto>> getShowtimesByDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {

        List<ShowtimeDto> showtimes = showtimeService.getShowtimesDtoByDateRange(startDate, endDate);
        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get showtimes for specific movie and theater (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/movie/{movieId}/theater/{theaterId}")
    public ResponseEntity<List<ShowtimeDto>> getShowtimesByMovieAndTheater(
            @PathVariable Long movieId,
            @PathVariable Long theaterId) {

        List<ShowtimeDto> showtimes = showtimeService.getShowtimesDtoByMovieAndTheater(movieId, theaterId);
        return ResponseEntity.ok(showtimes);
    }

    /**
     * Get popular showtimes (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/popular")
    public ResponseEntity<Page<ShowtimeDto>> getPopularShowtimes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ShowtimeDto> showtimes = showtimeService.getPopularShowtimesDto(pageable);

        return ResponseEntity.ok(showtimes);
    }

    /**
     * Create new showtime (Admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Showtime> createShowtime(@Valid @RequestBody CreateShowtimeRequest request) {
        Optional<Movie> movie = movieRepository.findById(request.movieId());
        Optional<Theater> theater = theaterRepository.findById(request.theaterId());

        if (movie.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (theater.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Showtime showtime = Showtime.builder()
                .movie(movie.get())
                .theater(theater.get())
                .showDatetime(request.showDatetime())
                .price(request.price())
                .availableSeats(theater.get().getCapacity()) // Initialize with full capacity
                .build();

        Showtime savedShowtime = showtimeRepository.save(showtime);
        return ResponseEntity.ok(savedShowtime);
    }

    /**
     * Update showtime (Admin only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Showtime> updateShowtime(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateShowtimeRequest request) {
        return showtimeRepository.findById(id)
                .map(showtime -> {
                    if (request.movieId() != null) {
                        movieRepository.findById(request.movieId())
                            .ifPresent(showtime::setMovie);
                    }
                    if (request.theaterId() != null) {
                        theaterRepository.findById(request.theaterId())
                            .ifPresent(theater -> {
                                showtime.setTheater(theater);
                                // Adjust available seats if theater changed
                                int bookedSeats = theater.getCapacity() - showtime.getAvailableSeats();
                                showtime.setAvailableSeats(theater.getCapacity() - bookedSeats);
                            });
                    }
                    if (request.showDatetime() != null) {
                        showtime.setShowDatetime(request.showDatetime());
                    }
                    if (request.price() != null) {
                        showtime.setPrice(request.price());
                    }

                    Showtime updatedShowtime = showtimeRepository.save(showtime);
                    return ResponseEntity.ok(updatedShowtime);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete showtime (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        return showtimeRepository.findById(id)
                .map(showtime -> {
                    showtimeRepository.delete(showtime);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Check seat availability for a showtime
     */
    @GetMapping("/{id}/availability")
    public ResponseEntity<ShowtimeAvailability> getShowtimeAvailability(@PathVariable Long id) {
        return showtimeRepository.findById(id)
                .map(showtime -> {
                    ShowtimeAvailability availability = new ShowtimeAvailability(
                        showtime.getAvailableSeats(),
                        showtime.getCapacity(),
                        showtime.getBookedSeats(),
                        showtime.isBookable()
                    );
                    return ResponseEntity.ok(availability);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get showtime statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowtimeStats> getShowtimeStats() {
        long totalShowtimes = showtimeRepository.count();
        long upcomingShowtimes = showtimeRepository.countUpcomingShowtimes(LocalDateTime.now());
        Long totalAvailableSeats = showtimeRepository.getTotalAvailableSeats(LocalDateTime.now());

        ShowtimeStats stats = new ShowtimeStats(
            totalShowtimes,
            upcomingShowtimes,
            totalAvailableSeats != null ? totalAvailableSeats : 0L
        );
        return ResponseEntity.ok(stats);
    }

    /**
     * Create Showtime Request DTO
     */
    public record CreateShowtimeRequest(
        Long movieId,
        Long theaterId,
        LocalDateTime showDatetime,
        java.math.BigDecimal price
    ) {}

    /**
     * Update Showtime Request DTO
     */
    public record UpdateShowtimeRequest(
        Long movieId,
        Long theaterId,
        LocalDateTime showDatetime,
        java.math.BigDecimal price
    ) {}

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