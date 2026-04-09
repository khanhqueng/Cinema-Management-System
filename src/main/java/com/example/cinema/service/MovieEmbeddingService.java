package com.example.cinema.service;

import com.example.cinema.config.AiProperties;
import com.example.cinema.entity.Movie;
import com.example.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.example.cinema.config.CacheConfig.*;

/**
 * Movie Embedding Service - Manages AI embeddings for movies
 *
 * Write path : VectorStore.add()              → vector_store table (for similarity search)
 *
 * Search path: VectorStore.similaritySearch()  → returns Documents with movieId metadata
 *              → fetch Movie entities by ID
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MovieEmbeddingService {

    private final MovieRepository movieRepository;
    private final VectorStore vectorStore;
    private final AiProperties aiProperties;

    /**
     * Generate and save embedding for a single movie.
     * Writes to vector_store table only (via Spring AI PgVectorStore).
     */
    @Transactional
    public Movie generateAndSaveMovieEmbedding(Movie movie) {
        try {
            log.info("Generating embedding for movie: {} (ID: {})", movie.getTitle(), movie.getId());

            // Upsert into vector_store for Spring AI similarity search.
            //    Document ID is a deterministic UUID derived from movieId → supports upsert
            //    via ON CONFLICT (id) DO UPDATE inside PgVectorStore.add().
            String movieText = EmbeddingService.buildMovieText(
                movie.getTitle(), movie.getDescription(),
                movie.getGenre(), movie.getDirector());
            String docId = movieDocId(movie.getId());
            Document doc = new Document(docId, movieText,
                Map.of("movieId", movie.getId().toString()));
            vectorStore.add(List.of(doc));

            log.info("Saved embedding for movie: {}", movie.getTitle());
            return movie;

        } catch (Exception e) {
            log.error("Failed to generate embedding for movie: {} (ID: {}). Error: {}",
                     movie.getTitle(), movie.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate movie embedding: " + e.getMessage(), e);
        }
    }

    /**
     * Generate embeddings for all movies that don't have one yet (batch processing).
     */
    @Transactional
    public void generateEmbeddingsForAllMovies() {
        log.info("Starting batch embedding generation for all movies without embeddings");

        List<Long> movieIdsWithoutEmbeddings = movieRepository.findMovieIdsWithoutEmbeddings();
        if (movieIdsWithoutEmbeddings.isEmpty()) {
            log.info("All movies already have embeddings. No processing needed.");
            return;
        }

        log.info("Found {} movies without embeddings. Starting generation...",
                 movieIdsWithoutEmbeddings.size());

        int successCount = 0;
        int failureCount = 0;

        for (Long movieId : movieIdsWithoutEmbeddings) {
            try {
                Movie movie = movieRepository.findById(movieId)
                        .orElseThrow(() -> new RuntimeException("Movie not found: " + movieId));
                generateAndSaveMovieEmbedding(movie);
                successCount++;
                Thread.sleep(Math.max(aiProperties.getBatchEmbeddingDelayMs(), 0));
            } catch (Exception e) {
                failureCount++;
                log.warn("Failed to generate embedding for movieId {}. Skipping.", movieId);
            }
        }

        log.info("Batch embedding completed. Success: {}, Failures: {}", successCount, failureCount);
    }

    /**
     * Regenerate embedding for a movie after content changes.
     * Evicts the embedding cache so OpenAI is called again, then re-upserts into vector_store.
     */
    @Transactional
    @CacheEvict(value = MOVIE_EMBEDDINGS_CACHE, allEntries = true)
    public Movie regenerateMovieEmbedding(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found: " + movieId));
        log.info("Regenerating embedding for movie: {} (ID: {})", movie.getTitle(), movieId);
        return generateAndSaveMovieEmbedding(movie);
    }

    /** Check if movie already has a document persisted in vector_store. */
    public boolean hasEmbedding(Movie movie) {
        return movie.getId() != null && movieRepository.existsEmbeddingByMovieId(movie.getId());
    }

    /** Embedding statistics. */
    public EmbeddingStats getEmbeddingStats() {
        long totalMovies = movieRepository.count();
        long moviesWithoutEmbeddings = movieRepository.findMovieIdsWithoutEmbeddings().size();
        long moviesWithEmbeddings = totalMovies - moviesWithoutEmbeddings;
        return EmbeddingStats.builder()
                .totalMovies(totalMovies)
                .moviesWithEmbeddings(moviesWithEmbeddings)
                .moviesWithoutEmbeddings(moviesWithoutEmbeddings)
                .embeddingCoverage(totalMovies == 0 ? 0.0 : (double) moviesWithEmbeddings / totalMovies * 100)
                .build();
    }

    /**
     * Find movies similar to targetMovie using Spring AI PgVectorStore.
     * VectorStore executes a native pgvector <=> query — no in-memory computation.
     */
    public List<Movie> findSimilarMovies(Movie targetMovie, double similarityThreshold, int limit) {
        if (!hasEmbedding(targetMovie)) {
            log.warn("Movie {} has no embedding. Cannot find similar movies.", targetMovie.getTitle());
            return List.of();
        }

        String movieText = EmbeddingService.buildMovieText(
            targetMovie.getTitle(), targetMovie.getDescription(),
            targetMovie.getGenre(), targetMovie.getDirector());

        double primaryThreshold = Math.max(similarityThreshold, aiProperties.getSimilarMoviePrimaryThreshold());
        double fallbackThreshold = Math.max(
            Math.min(primaryThreshold - 0.05, aiProperties.getSimilarMovieFallbackThreshold()),
            0.0
        );

        int topK = Math.max(limit + 1, limit * Math.max(aiProperties.getRecommendationCandidateMultiplier(), 1));

        List<Movie> results = searchAndFetch(movieText, primaryThreshold, topK, targetMovie.getId());

        if (results.size() < Math.min(2, limit)) {
            results = searchAndFetch(movieText, fallbackThreshold, topK, targetMovie.getId());
            log.info("findSimilarMovies - fallback threshold {} → {} results", fallbackThreshold, results.size());
        } else {
            log.info("findSimilarMovies - primary threshold {} → {} results", primaryThreshold, results.size());
        }

        return results.stream().limit(limit).collect(Collectors.toList());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private List<Movie> searchAndFetch(String query, double threshold, int topK, Long excludeMovieId) {
        List<Document> docs = vectorStore.similaritySearch(
            SearchRequest.builder()
                .query(query)
                .topK(topK)
                .similarityThreshold(threshold)
                .build());

        List<Long> movieIds = docs.stream()
            .map(d -> Long.parseLong(d.getMetadata().get("movieId").toString()))
            .filter(id -> !id.equals(excludeMovieId))
            .collect(Collectors.toList());

        return movieRepository.findAllById(movieIds);
    }

    /** Deterministic UUID for a movie document — guarantees upsert stability in vector_store. */
    private static String movieDocId(Long movieId) {
        return UUID.nameUUIDFromBytes(("movie:" + movieId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    @lombok.Builder
    @lombok.Data
    public static class EmbeddingStats {
        private long totalMovies;
        private long moviesWithEmbeddings;
        private long moviesWithoutEmbeddings;
        private double embeddingCoverage;
    }
}
