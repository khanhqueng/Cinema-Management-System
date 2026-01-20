package com.example.cinema.dto;

import com.example.cinema.entity.Movie;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Movie Data Transfer Object
 * Safe representation of Movie entity for API responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieDto {

    private Long id;
    private String title;
    private String description;
    private String director;
    private String cast;
    private String genre;
    private Integer duration; // in minutes
    private String language;
    private String posterUrl;
    private String trailerUrl;
    private BigDecimal rating;
    private String mpaaRating; // G, PG, PG-13, R, NC-17
    private LocalDateTime releaseDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}