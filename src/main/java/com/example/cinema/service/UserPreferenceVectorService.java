package com.example.cinema.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferenceVectorService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public Optional<List<Double>> findVectorIfCurrent(Long userId, int prefVersion, int favVersion) {
        String sql = """
                SELECT
                    preference_vector::text AS vector_text,
                    COALESCE((genre_weights->>'prefVersion')::int, -1) AS pref_version,
                    COALESCE((genre_weights->>'favVersion')::int, -1) AS fav_version
                FROM user_preference_vectors
                WHERE user_id = ?
                """;

        return jdbcTemplate.query(sql, rs -> {
            if (!rs.next()) {
                return Optional.<List<Double>>empty();
            }

            int storedPrefVersion = rs.getInt("pref_version");
            int storedFavVersion = rs.getInt("fav_version");
            if (storedPrefVersion != prefVersion || storedFavVersion != favVersion) {
                return Optional.<List<Double>>empty();
            }

            return Optional.of(parseVectorText(rs.getString("vector_text")));
        }, userId);
    }

    public Optional<List<Double>> findLatestVector(Long userId) {
        String sql = """
                SELECT preference_vector::text AS vector_text
                FROM user_preference_vectors
                WHERE user_id = ?
                """;

        return jdbcTemplate.query(sql, rs -> {
            if (!rs.next()) {
                return Optional.<List<Double>>empty();
            }
            return Optional.of(parseVectorText(rs.getString("vector_text")));
        }, userId);
    }

    public void upsertVector(Long userId,
                             List<Double> embedding,
                             int prefVersion,
                             int favVersion,
                             List<String> preferredGenres,
                             List<Long> favoriteMovieIds) {
        String sql = """
                INSERT INTO user_preference_vectors(user_id, preference_vector, last_updated, genre_weights, created_at)
                VALUES (?, CAST(? AS vector), NOW(), CAST(? AS jsonb), NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET
                    preference_vector = CAST(EXCLUDED.preference_vector AS vector),
                    last_updated = NOW(),
                    genre_weights = EXCLUDED.genre_weights
                """;

        String vectorLiteral = EmbeddingService.toVectorLiteral(embedding);
        String metadataJson = toMetadataJson(prefVersion, favVersion, preferredGenres, favoriteMovieIds);

        jdbcTemplate.update(sql, userId, vectorLiteral, metadataJson);
    }

    private String toMetadataJson(int prefVersion,
                                  int favVersion,
                                  List<String> preferredGenres,
                                  List<Long> favoriteMovieIds) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("prefVersion", prefVersion);
        payload.put("favVersion", favVersion);
        payload.put("preferredGenres", preferredGenres);
        payload.put("favoriteMovieIds", favoriteMovieIds);
        payload.put("updatedAt", Instant.now().toString());

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize user preference vector metadata", e);
        }
    }

    private List<Double> parseVectorText(String vectorText) {
        if (vectorText == null || vectorText.isBlank()) {
            return List.of();
        }

        String cleaned = vectorText.trim();
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1);
        }

        if (cleaned.isBlank()) {
            return List.of();
        }

        String[] values = cleaned.split(",");
        List<Double> vector = new java.util.ArrayList<>(values.length);
        for (String value : values) {
            vector.add(Double.parseDouble(value.trim()));
        }
        return vector;
    }
}
