package com.example.cinema.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Create Movie Request DTO
 * Data transfer object for creating new movies
 */
@Data
@Builder
public class CreateMovieRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @Size(max = 255, message = "Director name cannot exceed 255 characters")
    private String director;

    @Size(max = 1000, message = "Cast information cannot exceed 1000 characters")
    private String cast;

    @Size(max = 100, message = "Genre cannot exceed 100 characters")
    private String genre;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 500, message = "Duration cannot exceed 500 minutes")
    private Integer duration;

    @Size(max = 50, message = "Language cannot exceed 50 characters")
    private String language;

    @Size(max = 500, message = "Poster URL cannot exceed 500 characters")
    private String posterUrl;

    @Size(max = 500, message = "Trailer URL cannot exceed 500 characters")
    private String trailerUrl;

    @DecimalMin(value = "0.0", message = "Rating must be at least 0.0")
    @DecimalMax(value = "10.0", message = "Rating cannot exceed 10.0")
    private BigDecimal rating;

    @Pattern(regexp = "^(G|PG|PG-13|R|NC-17)$", message = "MPAA rating must be G, PG, PG-13, R, or NC-17")
    private String mpaaRating;

    private LocalDateTime releaseDate;

    @Builder.Default
    private Boolean isActive = true;
}