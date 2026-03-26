package com.example.cinema.service;

import com.example.cinema.config.AiProperties;
import com.example.cinema.entity.Movie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Orchestrates when to generate embeddings, without cluttering MovieService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MovieEmbeddingOrchestrator {

    private final AiProperties aiProperties;
    private final MovieEmbeddingService movieEmbeddingService;

    public void onMovieCreated(Movie movie) {
        if (movie == null) {
            return;
        }

        if (!aiProperties.isAutoGenerateMovieEmbeddingOnCreate()) {
            log.debug("Auto embedding generation is disabled (app.ai.auto-generate-movie-embedding-on-create=false). movieId={}", movie.getId());
            return;
        }

        log.info("Auto embedding generation triggered for movieId={} (async={})", movie.getId(), aiProperties.isEmbeddingAsync());

        if (aiProperties.isEmbeddingAsync()) {
            generateAsync(movie);
        } else {
            generateSync(movie);
        }
    }

    public void onMovieUpdated(Movie movie) {
        if (movie == null) {
            return;
        }

        if (!aiProperties.isAutoGenerateMovieEmbeddingOnUpdate()) {
            log.debug("Auto embedding regeneration on update is disabled. movieId={}", movie.getId());
            return;
        }

        log.info("Auto embedding regeneration triggered after update for movieId={} (async={})", movie.getId(), aiProperties.isEmbeddingAsync());

        if (aiProperties.isEmbeddingAsync()) {
            generateAsync(movie);
        } else {
            generateSync(movie);
        }
    }

    private void generateSync(Movie movie) {
        try {
            movieEmbeddingService.generateAndSaveMovieEmbedding(movie);
        } catch (Exception e) {
            // Don't break the core flow of creating movies
            log.warn("Auto embedding generation failed for movieId={}: {}", movie.getId(), e.getMessage());
        }
    }

    @Async
    protected void generateAsync(Movie movie) {
        generateSync(movie);
    }
}
