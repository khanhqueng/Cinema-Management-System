package com.example.cinema.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * AI Configuration
 * Spring AI auto-configures OpenAiEmbeddingModel and PgVectorStore beans
 * via spring-ai-starter-openai and spring-ai-starter-vector-store-pgvector.
 * This class only enables Spring Retry for resilient OpenAI API calls.
 */
@Configuration
@EnableRetry
public class OpenAIConfig {
}
