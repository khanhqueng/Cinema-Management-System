package com.example.cinema.dto;

import com.example.cinema.entity.UserGenrePreference;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Clean DTO for UserGenrePreference — no sensitive User fields exposed.
 */
@Builder
public record UserGenrePreferenceDto(
        Long id,
        Long userId,
        String userFullName,
        String genre,
        Integer preferenceScore,
        String preferenceLevel,
        boolean highPreference,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserGenrePreferenceDto from(UserGenrePreference p) {
        return UserGenrePreferenceDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .userFullName(p.getUser().getFullName())
                .genre(p.getGenre())
                .preferenceScore(p.getPreferenceScore())
                .preferenceLevel(p.getPreferenceLevel())
                .highPreference(p.isHighPreference())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
