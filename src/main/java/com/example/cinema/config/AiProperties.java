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
     * If true, embedding generation runs asynchronously (doesn't block create-movie API).
     */
    private boolean embeddingAsync = true;
}

