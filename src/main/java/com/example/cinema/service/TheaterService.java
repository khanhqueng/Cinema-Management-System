package com.example.cinema.service;

import com.example.cinema.dto.TheaterDto;
import com.example.cinema.entity.Theater;
import com.example.cinema.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Theater Service - Business Logic for Theater Management
 * Handles all theater-related business operations
 */
@Service
@RequiredArgsConstructor
public class TheaterService {

    private final TheaterRepository theaterRepository;

    /**
     * Get all theaters with pagination
     */
    public Page<Theater> getAllTheaters(Pageable pageable) {
        return theaterRepository.findAll(pageable);
    }

    /**
     * Get theater by ID
     */
    public Optional<Theater> getTheaterById(Long id) {
        return theaterRepository.findById(id);
    }

    /**
     * Search theaters by name
     */
    public Page<Theater> searchTheaters(String name, Pageable pageable) {
        return theaterRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    /**
     * Get theaters by type
     */
    public Page<Theater> getTheatersByType(Theater.TheaterType type, Pageable pageable) {
        return theaterRepository.findByTheaterType(type, pageable);
    }

    /**
     * Get theaters by capacity range
     */
    public Page<Theater> getTheatersByCapacity(Integer minCapacity, Integer maxCapacity, Pageable pageable) {
        return theaterRepository.findByCapacityRange(minCapacity, maxCapacity, pageable);
    }

    /**
     * Get theaters with active showtimes
     */
    public List<Theater> getTheatersWithShowtimes() {
        return theaterRepository.findTheatersWithActiveShowtimes();
    }

    /**
     * Create new theater
     */
    public Theater createTheater(Theater theater) {
        return theaterRepository.save(theater);
    }

    /**
     * Update theater
     */
    public Optional<Theater> updateTheater(Long id, Theater theaterDetails) {
        return theaterRepository.findById(id)
                .map(theater -> {
                    theater.setName(theaterDetails.getName());
                    theater.setCapacity(theaterDetails.getCapacity());
                    theater.setTheaterType(theaterDetails.getTheaterType());

                    return theaterRepository.save(theater);
                });
    }

    /**
     * Delete theater
     */
    public boolean deleteTheater(Long id) {
        return theaterRepository.findById(id)
                .map(theater -> {
                    theaterRepository.delete(theater);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Get theater utilization data
     */
    public List<TheaterUtilization> getTheaterUtilization() {
        List<Object[]> results = theaterRepository.getTheaterUtilization();

        return results.stream()
                .map(row -> new TheaterUtilization(
                    (Long) row[0],      // id
                    (String) row[1],    // name
                    (Integer) row[2],   // capacity
                    ((Number) row[3]).longValue() // totalBookedSeats
                ))
                .toList();
    }

    /**
     * Get theater statistics
     */
    public TheaterStats getTheaterStats() {
        long totalTheaters = theaterRepository.count();
        long standardTheaters = theaterRepository.countByTheaterType(Theater.TheaterType.STANDARD);
        long vipTheaters = theaterRepository.countByTheaterType(Theater.TheaterType.VIP);
        Long totalCapacity = theaterRepository.getTotalCapacity();

        return new TheaterStats(
            totalTheaters,
            standardTheaters,
            vipTheaters,
            totalCapacity != null ? totalCapacity : 0L
        );
    }

    /**
     * Check if theater exists
     */
    public boolean theaterExists(Long id) {
        return theaterRepository.existsById(id);
    }

    // ===== DTO Methods (avoid Hibernate proxy issues) =====

    /**
     * Get all theaters as DTO with pagination
     */
    public Page<TheaterDto> getAllTheatersDto(Pageable pageable) {
        Page<Theater> theaters = theaterRepository.findAll(pageable);
        return theaters.map(this::convertToDto);
    }

    /**
     * Get theater by ID as DTO
     */
    public Optional<TheaterDto> getTheaterDtoById(Long id) {
        return theaterRepository.findById(id).map(this::convertToDto);
    }

    /**
     * Search theaters by name as DTO
     */
    public Page<TheaterDto> searchTheatersDto(String name, Pageable pageable) {
        Page<Theater> theaters = theaterRepository.findByNameContainingIgnoreCase(name, pageable);
        return theaters.map(this::convertToDto);
    }

    /**
     * Get theaters by type as DTO
     */
    public Page<TheaterDto> getTheatersDtoByType(Theater.TheaterType type, Pageable pageable) {
        Page<Theater> theaters = theaterRepository.findByTheaterType(type, pageable);
        return theaters.map(this::convertToDto);
    }

    /**
     * Get theaters by capacity range as DTO
     */
    public Page<TheaterDto> getTheatersDtoByCapacity(Integer minCapacity, Integer maxCapacity, Pageable pageable) {
        Page<Theater> theaters = theaterRepository.findByCapacityRange(minCapacity, maxCapacity, pageable);
        return theaters.map(this::convertToDto);
    }

    /**
     * Get theaters with active showtimes as DTO
     */
    public List<TheaterDto> getTheatersWithShowtimesDto() {
        List<Theater> theaters = theaterRepository.findTheatersWithActiveShowtimes();
        return theaters.stream().map(this::convertToDto).toList();
    }

    /**
     * Convert Theater entity to DTO (avoids Hibernate proxy issues)
     */
    private TheaterDto convertToDto(Theater theater) {
        return TheaterDto.builder()
                .id(theater.getId())
                .name(theater.getName())
                .capacity(theater.getCapacity())
                .theaterType(theater.getTheaterType())
                .createdAt(theater.getCreatedAt())
                .build();
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