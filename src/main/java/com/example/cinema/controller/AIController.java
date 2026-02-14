package com.example.cinema.controller;

import com.example.cinema.service.RecommendationService;
import com.example.cinema.service.MovieEmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * AI Controller - AI-Powered Movie Features
 * Provides semantic search, AI recommendations, and embedding management
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AIController {

    private final RecommendationService recommendationService;
    private final MovieEmbeddingService movieEmbeddingService;

    /**
     * Semantic search for movies using natural language
     * Example: "action movies with superheroes"
     */
    @GetMapping("/search")
    public ResponseEntity<RecommendationService.RecommendationResponse> semanticSearch(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("Semantic search request: query='{}', limit={}", query, limit);

        try {
            RecommendationService.RecommendationResponse response =
                    recommendationService.semanticMovieSearch(query, limit);

            log.info("Semantic search completed: found {} results", response.movies().size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Semantic search failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(new RecommendationService.RecommendationResponse(
                    "Search Results",
                    java.util.List.of(),
                    java.util.List.of("Search failed: " + e.getMessage()),
                    RecommendationService.RecommendationType.AI_PERSONALIZED
            ));
        }
    }

    /**
     * Get AI-powered personalized recommendations
     * Uses vector embeddings for superior recommendation quality
     */
    @GetMapping("/recommendations/personalized")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<RecommendationService.RecommendationResponse> getAIRecommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("AI recommendations request: userId={}, limit={}", userId, limit);

        try {
            RecommendationService.RecommendationResponse response =
                    recommendationService.getAIPersonalizedRecommendations(userId, limit);

            // If AI recommendations fail or return empty, fallback to traditional
            if (response.movies().isEmpty()) {
                log.warn("AI recommendations returned empty, falling back to traditional");
                response = recommendationService.getPersonalizedRecommendations(userId, limit);
            }

            log.info("AI recommendations completed: found {} results", response.movies().size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("AI recommendations failed: {}", e.getMessage(), e);
            // Return traditional recommendations as fallback
            RecommendationService.RecommendationResponse fallback =
                    recommendationService.getPersonalizedRecommendations(userId, limit);
            return ResponseEntity.ok(fallback);
        }
    }

    /**
     * Find movies similar to a specific movie using AI
     */
    @GetMapping("/movies/{movieId}/similar")
    public ResponseEntity<RecommendationService.RecommendationResponse> findSimilarMovies(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "8") int limit) {

        log.info("Similar movies request: movieId={}, limit={}", movieId, limit);

        try {
            RecommendationService.RecommendationResponse response =
                    recommendationService.findSimilarMovies(movieId, limit);

            log.info("Similar movies found: {} results", response.movies().size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Similar movies search failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(new RecommendationService.RecommendationResponse(
                    "Similar Movies",
                    java.util.List.of(),
                    java.util.List.of("Similar movies search failed: " + e.getMessage()),
                    RecommendationService.RecommendationType.AI_SIMILAR_MOVIES
            ));
        }
    }

    /**
     * Generate embedding for a specific movie (Admin only)
     * Useful for re-generating embeddings when movie content changes
     */
    @PostMapping("/movies/{movieId}/embedding")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> generateMovieEmbedding(@PathVariable Long movieId) {

        log.info("Generate embedding request for movieId: {}", movieId);

        try {
            movieEmbeddingService.regenerateMovieEmbedding(movieId);

            log.info("Movie embedding generated successfully for movieId: {}", movieId);
            return ResponseEntity.ok("Embedding generated successfully for movie ID: " + movieId);

        } catch (Exception e) {
            log.error("Failed to generate embedding for movieId {}: {}", movieId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body("Failed to generate embedding: " + e.getMessage());
        }
    }

    /**
     * Batch generate embeddings for all movies without embeddings (Admin only)
     */
    @PostMapping("/movies/embeddings/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> generateAllEmbeddings() {

        log.info("Batch embedding generation request received");

        try {
            movieEmbeddingService.generateEmbeddingsForAllMovies();

            log.info("Batch embedding generation completed successfully");
            return ResponseEntity.ok("Batch embedding generation started. Check logs for progress.");

        } catch (Exception e) {
            log.error("Batch embedding generation failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body("Batch embedding generation failed: " + e.getMessage());
        }
    }

    /**
     * Get embedding statistics (Admin only)
     */
    @GetMapping("/embeddings/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieEmbeddingService.EmbeddingStats> getEmbeddingStats() {

        log.info("Embedding stats request received");

        try {
            MovieEmbeddingService.EmbeddingStats stats = movieEmbeddingService.getEmbeddingStats();

            log.info("Embedding stats retrieved: {}/{} movies have embeddings",
                    stats.getMoviesWithEmbeddings(), stats.getTotalMovies());

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Failed to get embedding stats: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * AI-powered mixed recommendations with multiple strategies
     */
    @GetMapping("/recommendations/mixed")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<RecommendationService.MixedRecommendationResponse> getMixedAIRecommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "20") int limit) {

        log.info("Mixed AI recommendations request: userId={}, limit={}", userId, limit);

        try {
            // Get traditional mixed recommendations first
            RecommendationService.MixedRecommendationResponse response =
                    recommendationService.getMixedRecommendations(userId, limit);

            // Try to add AI-powered section if possible
            try {
                RecommendationService.RecommendationResponse aiRecommendations =
                        recommendationService.getAIPersonalizedRecommendations(userId, 8);

                if (!aiRecommendations.movies().isEmpty()) {
                    // Add AI section to the beginning
                    java.util.List<RecommendationService.RecommendationSection> sections =
                            new java.util.ArrayList<>(response.sections());

                    sections.add(0, new RecommendationService.RecommendationSection(
                            "AI Recommended for You",
                            aiRecommendations.movies().stream().limit(5).collect(java.util.stream.Collectors.toList()),
                            "Powered by AI analysis of your preferences"
                    ));

                    response = new RecommendationService.MixedRecommendationResponse(sections);
                }

            } catch (Exception aiError) {
                log.warn("AI recommendations in mixed response failed: {}", aiError.getMessage());
                // Continue with traditional recommendations
            }

            log.info("Mixed AI recommendations completed: {} sections", response.sections().size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Mixed AI recommendations failed: {}", e.getMessage(), e);
            // Return basic recommendations as fallback
            RecommendationService.MixedRecommendationResponse fallback =
                    recommendationService.getMixedRecommendations(userId, limit);
            return ResponseEntity.ok(fallback);
        }
    }
}