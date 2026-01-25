package com.example.cinema.dto;

import com.example.cinema.entity.Theater;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Theater DTO - Transfer Object for Theater Data
 * Avoids Hibernate proxy serialization issues by using plain data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TheaterDto {

    private Long id;
    private String name;
    private Integer capacity;
    private Theater.TheaterType theaterType;
    private LocalDateTime createdAt;

    // Computed fields can be added here if needed
    public String getTheaterTypeName() {
        return theaterType != null ? theaterType.name() : null;
    }

    public boolean isVip() {
        return theaterType == Theater.TheaterType.VIP;
    }

    public boolean isStandard() {
        return theaterType == Theater.TheaterType.STANDARD;
    }
}