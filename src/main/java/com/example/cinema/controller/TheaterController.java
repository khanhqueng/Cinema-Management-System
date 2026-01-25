package com.example.cinema.controller;

import com.example.cinema.dto.TheaterDto;
import com.example.cinema.entity.Theater;
import com.example.cinema.repository.TheaterRepository;
import com.example.cinema.service.TheaterService;
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
    private final TheaterService theaterService;

    /**
     * Get all theaters with pagination and sorting (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping
    public ResponseEntity<Page<TheaterDto>> getAllTheaters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TheaterDto> theaters = theaterService.getAllTheatersDto(pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theater by ID (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/{id}")
    public ResponseEntity<TheaterDto> getTheaterById(@PathVariable Long id) {
        Optional<TheaterDto> theater = theaterService.getTheaterDtoById(id);
        return theater.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search theaters by name (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/search")
    public ResponseEntity<Page<TheaterDto>> searchTheaters(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<TheaterDto> theaters = theaterService.searchTheatersDto(name, pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theaters by type (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<Page<TheaterDto>> getTheatersByType(
            @PathVariable Theater.TheaterType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<TheaterDto> theaters = theaterService.getTheatersDtoByType(type, pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theaters by capacity range (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/capacity")
    public ResponseEntity<Page<TheaterDto>> getTheatersByCapacity(
            @RequestParam Integer minCapacity,
            @RequestParam Integer maxCapacity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("capacity").ascending());
        Page<TheaterDto> theaters = theaterService.getTheatersDtoByCapacity(minCapacity, maxCapacity, pageable);

        return ResponseEntity.ok(theaters);
    }

    /**
     * Get theaters with active showtimes (returns DTO to avoid Hibernate proxy issues)
     */
    @GetMapping("/with-showtimes")
    public ResponseEntity<List<TheaterDto>> getTheatersWithShowtimes() {
        List<TheaterDto> theaters = theaterService.getTheatersWithShowtimesDto();
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