package com.example.cinema.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI feature flags / tuning.
 */
@Component
@ConfigurationProperties(prefix = "app.ai")
@Data
public class AiProperties {

    /**
     * If true, the system will try to generate and persist a pgvector embedding
     * right after a movie is created/updated. This requires OpenAI to be configured
     * and reachable.
     */
    private boolean autoGenerateMovieEmbeddingOnCreate = false;

    /**
     * If true, the system will regenerate the embedding when a movie's content is updated.
     */
    private boolean autoGenerateMovieEmbeddingOnUpdate = false;

    /**
     * If true, embedding generation runs asynchronously (doesn't block create-movie API).
     */
    private boolean embeddingAsync = true;

    /**
     * If true, generate movie embeddings in Java after seed data is loaded/reloaded.
     * Useful for local/demo environments to avoid SQL-level placeholder vectors.
     */
    private boolean seedMovieEmbeddingsOnStartup = false;

    /**
     * Sleep between embedding calls in batch seed/update flow to reduce API throttling.
     */
    private int batchEmbeddingDelayMs = 250;

    /**
     * Similarity floor used by movie-to-movie retrieval before fallback.
     */
    private double similarMoviePrimaryThreshold = 0.72;

    /**
     * Fallback threshold when primary returns too few similar movies.
     */
    private double similarMovieFallbackThreshold = 0.56;

    /**
     * Threshold for AI personalized recommendations.
     */
    private double personalizedPrimaryThreshold = 0.72;

    /**
     * Fallback threshold for AI personalized recommendations.
     */
    private double personalizedFallbackThreshold = 0.56;

    /**
     * Threshold for semantic search.
     */
    private double semanticPrimaryThreshold = 0.68;

    /**
     * Fallback threshold for semantic search.
     */
    private double semanticFallbackThreshold = 0.50;

    /**
     * Multiplier to widen candidate pool before post-filtering (favorites/excludes).
     */
    private int recommendationCandidateMultiplier = 3;
}

