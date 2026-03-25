package com.example.cinema.service;

import com.example.cinema.entity.Movie;
import com.example.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static com.example.cinema.config.CacheConfig.*;

/**
 * Movie Embedding Service - Manages AI embeddings for movies
 * Handles generation and storage of movie embeddings for AI recommendations
 * With intelligent caching for performance optimization
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MovieEmbeddingService {

    private final MovieRepository movieRepository;
    private final EmbeddingService embeddingService;

    /**
     * Generate and save embedding for a single movie
     * Gọi embeddingService với movieId + contentHash → cache key stable
     */
    @Transactional
    public Movie generateAndSaveMovieEmbedding(Movie movie) {
        try {
            log.info("Generating embedding for movie: {} (ID: {})", movie.getTitle(), movie.getId());

            List<Double> embedding = embeddingService.generateMovieEmbedding(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getGenre(),
                movie.getDirector()
            );

            // Persist as pgvector text format: [0.1,0.2,...]
            String embeddingString = convertEmbeddingToVectorString(embedding);
            movie.setEmbedding(embeddingString);

            Movie savedMovie = movieRepository.save(movie);

            log.info("Successfully generated and saved embedding for movie: {}", movie.getTitle());
            return savedMovie;

        } catch (Exception e) {
            log.error("Failed to generate embedding for movie: {} (ID: {}). Error: {}",
                     movie.getTitle(), movie.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate movie embedding: " + e.getMessage(), e);
        }
    }

    /**
     * Generate embeddings for all movies that don't have embeddings
     * This is useful for batch processing existing movies
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
                        .orElseThrow(() -> new RuntimeException("Movie not found with ID: " + movieId));

                generateAndSaveMovieEmbedding(movie);
                successCount++;

                // Add small delay to avoid hitting OpenAI rate limits
                Thread.sleep(500); // 500ms delay between requests

            } catch (Exception e) {
                failureCount++;
                log.warn("Failed to generate embedding for movieId {}. Continuing with next movie.", movieId);
            }
        }

        log.info("Batch embedding generation completed. Success: {}, Failures: {}",
                 successCount, failureCount);
    }

    /**
     * Regenerate embedding for a movie (khi nội dung phim thay đổi)
     * Evict MOVIE_EMBEDDINGS_CACHE → lần sau generateEmbedding sẽ gọi lại OpenAI
     */
    @Transactional
    @CacheEvict(value = MOVIE_EMBEDDINGS_CACHE, allEntries = true)
    public Movie regenerateMovieEmbedding(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found with ID: " + movieId));

        log.info("Regenerating embedding for movie: {} (ID: {})", movie.getTitle(), movieId);

        return generateAndSaveMovieEmbedding(movie);
    }

    /**
     * Check if movie has embedding
     */
    public boolean hasEmbedding(Movie movie) {
        return movie.getEmbedding() != null && !movie.getEmbedding().trim().isEmpty();
    }

    /**
     * Get embedding statistics
     * Không cache - chỉ là 2 câu COUNT/query DB, nhanh và nhẹ
     */
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
     * Find similar movies using vector similarity
     * Không cache - đọc embedding từ DB (đã persist sẵn) + tính cosine similarity in-memory
     * Không gọi OpenAI → không tốn token, không cần cache
     */
    public List<Movie> findSimilarMovies(Movie targetMovie, double similarityThreshold, int limit) {
        if (!hasEmbedding(targetMovie)) {
            log.warn("Movie {} does not have embedding. Cannot find similar movies.", targetMovie.getTitle());
            return List.of();
        }

        // Use fallback approach - in-memory similarity calculation with fixed Hibernate vector mapping
        // Get movie IDs that have embeddings
        List<Long> movieIdsWithEmbeddings = movieRepository.findMovieIdsWithEmbeddings();

        if (movieIdsWithEmbeddings.isEmpty()) {
            log.warn("No movies with embeddings found in database");
            return List.of();
        }

        // Load movies by IDs (without embedding conflicts)
        List<Movie> moviesWithEmbeddings = movieRepository.findAllById(movieIdsWithEmbeddings);
        log.info("Found movies with embeddings: {}", moviesWithEmbeddings.size());

        // Calculate similarities in-memory
        List<MovieSimilarityResult> similarityResults = new ArrayList<>();
        List<Double> targetEmbedding = parseVectorText(targetMovie.getEmbedding());

        for (Movie movie : moviesWithEmbeddings) {
            try {
                List<Double> movieEmbedding = parseVectorText(movie.getEmbedding());
                if (movieEmbedding.isEmpty()) continue;

                double similarity = embeddingService.calculateCosineSimilarity(targetEmbedding, movieEmbedding);
                similarityResults.add(new MovieSimilarityResult(movie, similarity));
            } catch (Exception e) {
                log.warn("Failed to process embedding for movie {}: {}", movie.getId(), e.getMessage());
            }
        }

        // Apply improved thresholds with fallback logic
        double primaryThreshold = Math.max(similarityThreshold, 0.65);
        double fallbackThreshold = Math.max(similarityThreshold * 0.75, 0.5);

        List<Movie> results = similarityResults.stream()
                .filter(result -> result.similarity >= primaryThreshold)
                .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                .limit(limit)
                .map(result -> result.movie)
                .collect(java.util.stream.Collectors.toList());

        // Fallback if not enough results
        if (results.size() < Math.min(2, limit) && !similarityResults.isEmpty()) {
            results = similarityResults.stream()
                    .filter(result -> result.similarity >= fallbackThreshold)
                    .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                    .limit(limit)
                    .map(result -> result.movie)
                    .collect(java.util.stream.Collectors.toList());

            log.info("MovieEmbeddingService - used fallback threshold: {} for {} results",
                    fallbackThreshold, results.size());
        } else {
            log.info("MovieEmbeddingService - used primary threshold: {} for {} results",
                    primaryThreshold, results.size());
        }

        return results;
    }

    private String convertEmbeddingToVectorString(List<Double> embedding) {
        if (embedding == null || embedding.isEmpty()) {
            throw new IllegalArgumentException("Embedding cannot be null or empty");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < embedding.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding.get(i));
        }
        sb.append("]");
        return sb.toString();
    }

    private List<Double> parseVectorText(String vectorText) {
        if (vectorText == null || vectorText.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String cleanText = vectorText.trim();
        if (cleanText.startsWith("[") && cleanText.endsWith("]")) {
            cleanText = cleanText.substring(1, cleanText.length() - 1);
        }

        List<Double> result = new ArrayList<>();
        String[] values = cleanText.split(",");

        for (String value : values) {
            try {
                result.add(Double.parseDouble(value.trim()));
            } catch (NumberFormatException e) {
                log.warn("Invalid vector value: {}", value);
            }
        }

        return result;
    }

    /**
     * Helper class for similarity calculation
     */
    private static class MovieSimilarityResult {
        Movie movie;
        double similarity;

        MovieSimilarityResult(Movie movie, double similarity) {
            this.movie = movie;
            this.similarity = similarity;
        }
    }

    /**
     * Embedding Statistics DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class EmbeddingStats {
        private long totalMovies;
        private long moviesWithEmbeddings;
        private long moviesWithoutEmbeddings;
        private double embeddingCoverage; // Percentage
    }
}
