package com.example.cinema.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.example.cinema.config.CacheConfig.*;

/**
 * Embedding Service - Generates vector embeddings via Spring AI OpenAI
 *
 * Cache key strategy:
 * - generateMovieEmbedding: key = movieId + content hash
 *   → cache miss when title/genre/director change → auto-regenerate
 *
 * VectorStore (PgVectorStore) is injected separately in MovieEmbeddingService
 * and RecommendationService; it calls EmbeddingModel internally for search queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;

    /**
     * Generate raw text embedding — единственная точка вызова OpenAI.
     *
     * Cache key = contentHash(text) — stable hash of cleaned text.
     * TTL: 30 days.
     *
     * @Retryable wraps the OpenAI call for transient failures.
     */
    @Cacheable(value = MOVIE_EMBEDDINGS_CACHE,
               key = "'text:' + T(com.example.cinema.service.EmbeddingService).contentHash(#text, '', '')")
    @Retryable(
        retryFor = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public List<Double> generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Text cannot be null or empty");
        }
        String cleanedText = cleanText(text);
        log.debug("Generating embedding for text: {} characters", cleanedText.length());
        float[] embeddingArray = embeddingModel.embed(cleanedText);
        List<Double> embedding = new java.util.ArrayList<>(embeddingArray.length);
        for (float value : embeddingArray) {
            embedding.add((double) value);
        }
        log.debug("Successfully generated embedding with {} dimensions", embedding.size());
        return embedding;
    }

    /**
     * Generate embedding for a movie.
     *
     * Cache key = movieId + hash(title + genre + director)
     * → auto-miss when movie content changes.
     */
    @Cacheable(value = MOVIE_EMBEDDINGS_CACHE,
               key = "'movie:' + #movieId + ':v' + T(com.example.cinema.service.EmbeddingService).contentHash(#title, #genre, #director)")
    public List<Double> generateMovieEmbedding(Long movieId, String title, String description,
                                               String genre, String director) {
        String movieText = buildMovieText(title, description, genre, director);
        if (movieText.isEmpty()) {
            throw new IllegalArgumentException("Movie must have at least title or description");
        }
        log.debug("Generating embedding for movie: {}", title);
        return generateEmbedding(movieText);
    }

    // ── Static text-building helpers ────────────────────────────────────────

    /**
     * Build the canonical text representation of a movie used for embedding.
     * Used both when generating the embedding (write path) and when adding a
     * Document to VectorStore (so both paths produce identical text → same embedding).
     */
    public static String buildMovieText(String title, String description,
                                        String genre, String director) {
        StringBuilder sb = new StringBuilder();
        if (title != null && !title.trim().isEmpty())
            sb.append("Title: ").append(title.trim()).append(". ");
        if (description != null && !description.trim().isEmpty())
            sb.append("Description: ").append(description.trim()).append(". ");
        if (genre != null && !genre.trim().isEmpty())
            sb.append("Genre: ").append(genre.trim()).append(". ");
        if (director != null && !director.trim().isEmpty())
            sb.append("Director: ").append(director.trim()).append(".");
        return sb.toString().trim();
    }

    /**
     * Build preference text for a user — used as the VectorStore search query
     * in getAIPersonalizedRecommendations().
     */
    public static String buildUserPreferenceText(List<String> preferredGenres,
                                                 List<String> favoriteMovieTitles) {
        StringBuilder sb = new StringBuilder();
        if (preferredGenres != null && !preferredGenres.isEmpty())
            sb.append("User prefers these movie genres: ")
              .append(String.join(", ", preferredGenres)).append(". ");
        if (favoriteMovieTitles != null && !favoriteMovieTitles.isEmpty())
            sb.append("User likes these movies: ")
              .append(String.join(", ", favoriteMovieTitles)).append(".");
        String text = sb.toString().trim();
        return text.isEmpty() ? "User enjoys watching movies" : text;
    }

    // ── Internal utilities ───────────────────────────────────────────────────

    private String cleanText(String text) {
        return text.trim()
                   .replaceAll("\\s+", " ")
                   .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "")
                   .substring(0, Math.min(text.length(), 8000));
    }

    /**
     * Stable hash of movie content fields — used as the cache key version.
     * Deterministic across JVM restarts (unlike Java hashCode).
     */
    public static String contentHash(String title, String genre, String director) {
        String raw = (title == null ? "" : title.toLowerCase().trim())
                   + "|" + (genre == null ? "" : genre.toLowerCase().trim())
                   + "|" + (director == null ? "" : director.toLowerCase().trim());
        int h = 0;
        for (char c : raw.toCharArray()) h = 31 * h + c;
        return String.format("%08x", h & 0xFFFFFFFFL);
    }
}
