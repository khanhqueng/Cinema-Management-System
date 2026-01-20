package com.example.cinema.controller;

import com.example.cinema.entity.Theater;
import com.example.cinema.repository.TheaterRepository;
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
 * Theater Controller - CRUD Operations for Theater Management
 * Provides comprehensive theater management endpoints with proper authorization
 */
@RestController
@RequestMapping("/api/theaters")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TheaterController {

    private final TheaterRepository theaterRepository;

    /**
     * Get all theaters with pagination and sorting
     */
    @GetMapping
    public ResponseEntity<Page<Theater>> getAllTheaters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Theater> theaters = theaterRepository.findAll(pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theater by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Theater> getTheaterById(@PathVariable Long id) {
        Optional<Theater> theater = theaterRepository.findById(id);
        return theater.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search theaters by name
     */
    @GetMapping("/search")
    public ResponseEntity<Page<Theater>> searchTheaters(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Theater> theaters = theaterRepository.findByNameContainingIgnoreCase(name, pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theaters by type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<Page<Theater>> getTheatersByType(
            @PathVariable Theater.TheaterType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Theater> theaters = theaterRepository.findByTheaterType(type, pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theaters by capacity range
     */
    @GetMapping("/capacity")
    public ResponseEntity<Page<Theater>> getTheatersByCapacity(
            @RequestParam Integer minCapacity,
            @RequestParam Integer maxCapacity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("capacity").ascending());
        Page<Theater> theaters = theaterRepository.findByCapacityRange(minCapacity, maxCapacity, pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theaters with active showtimes
     */
    @GetMapping("/with-showtimes")
    public ResponseEntity<List<Theater>> getTheatersWithShowtimes() {
        List<Theater> theaters = theaterRepository.findTheatersWithActiveShowtimes();
        return ResponseEntity.ok(theaters);
    }

    /**
     * Create new theater (Admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Theater> createTheater(@Valid @RequestBody Theater theater) {
        Theater savedTheater = theaterRepository.save(theater);
        return ResponseEntity.ok(savedTheater);
    }

    /**
     * Update theater (Admin only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Theater> updateTheater(@PathVariable Long id, @Valid @RequestBody Theater theaterDetails) {
        return theaterRepository.findById(id)
                .map(theater -> {
                    theater.setName(theaterDetails.getName());
                    theater.setCapacity(theaterDetails.getCapacity());
                    theater.setTheaterType(theaterDetails.getTheaterType());

                    Theater updatedTheater = theaterRepository.save(theater);
                    return ResponseEntity.ok(updatedTheater);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete theater (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTheater(@PathVariable Long id) {
        return theaterRepository.findById(id)
                .map(theater -> {
                    theaterRepository.delete(theater);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get theater utilization data (Admin only)
     */
    @GetMapping("/utilization")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TheaterUtilization>> getTheaterUtilization() {
        List<Object[]> results = theaterRepository.getTheaterUtilization();

        List<TheaterUtilization> utilization = results.stream()
                .map(row -> new TheaterUtilization(
                    (Long) row[0],      // id
                    (String) row[1],    // name
                    (Integer) row[2],   // capacity
                    ((Number) row[3]).longValue() // totalBookedSeats
                ))
                .toList();

        return ResponseEntity.ok(utilization);
    }

    /**
     * Get theater statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TheaterStats> getTheaterStats() {
        long totalTheaters = theaterRepository.count();
        long standardTheaters = theaterRepository.countByTheaterType(Theater.TheaterType.STANDARD);
        long vipTheaters = theaterRepository.countByTheaterType(Theater.TheaterType.VIP);
        Long totalCapacity = theaterRepository.getTotalCapacity();

        TheaterStats stats = new TheaterStats(
            totalTheaters,
            standardTheaters,
            vipTheaters,
            totalCapacity != null ? totalCapacity : 0L
        );
        return ResponseEntity.ok(stats);
    }

    /**
     * Get theater types enum values
     */
    @GetMapping("/types")
    public ResponseEntity<Theater.TheaterType[]> getTheaterTypes() {
        return ResponseEntity.ok(Theater.TheaterType.values());
    }

    /**
     * Theater Utilization DTO
     */
    public record TheaterUtilization(
        Long id,
        String name,
        Integer capacity,
        Long totalBookedSeats
    ) {
        public double getUtilizationRate() {
            if (capacity == null || capacity == 0) return 0.0;
            return ((double) totalBookedSeats / capacity) * 100;
        }
    }

    /**
     * Theater Statistics DTO
     */
    public record TheaterStats(
        long totalTheaters,
        long standardTheaters,
        long vipTheaters,
        long totalCapacity
    ) {}
}