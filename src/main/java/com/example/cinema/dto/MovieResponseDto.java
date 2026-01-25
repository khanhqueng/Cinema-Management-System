package com.example.cinema.dto;

import com.example.cinema.entity.Movie;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Movie Response DTO - Optimized response format with computed fields
 * Matches the expected frontend response structure
 */
@Data
@Builder
public class MovieResponseDto {
    private Long id;
    private String title;
    private String description;
    private String genre;
    private String director;
    private Integer durationMinutes;
    private LocalDate releaseDate;
    private String posterUrl;
    private BigDecimal priceBase;
    private LocalDateTime createdAt;

    // Computed fields
    private Boolean currentlyShowing;
    private String formattedDuration;
    private Double averageRating;
    private Long reviewCount;

    /**
     * Convert Movie entity to MovieResponseDto with computed fields
     */
    public static MovieResponseDto from(Movie movie, Double averageRating, Long reviewCount) {
        return MovieResponseDto.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .genre(movie.getGenre())
                .director(movie.getDirector())
                .durationMinutes(movie.getDurationMinutes())
                .releaseDate(movie.getReleaseDate())
                .posterUrl(movie.getPosterUrl())
                .priceBase(movie.getPriceBase())
                .createdAt(movie.getCreatedAt())
                .currentlyShowing(movie.isCurrentlyShowing())
                .formattedDuration(movie.getFormattedDuration())
                .averageRating(averageRating != null ? averageRating : 0.0)
                .reviewCount(reviewCount != null ? reviewCount : 0L)
                .build();
    }

    /**
     * Convert Movie entity to MovieResponseDto without database calls (for cases where ratings are not needed)
     */
    public static MovieResponseDto from(Movie movie) {
        return MovieResponseDto.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .genre(movie.getGenre())
                .director(movie.getDirector())
                .durationMinutes(movie.getDurationMinutes())
                .releaseDate(movie.getReleaseDate())
                .posterUrl(movie.getPosterUrl())
                .priceBase(movie.getPriceBase())
                .createdAt(movie.getCreatedAt())
                .currentlyShowing(movie.isCurrentlyShowing())
                .formattedDuration(movie.getFormattedDuration())
                .averageRating(0.0)
                .reviewCount(0L)
                .build();
    }
}