package com.example.cinema.config;

import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

import java.time.Duration;

/**
 * OpenAI Configuration
 * Configures OpenAI services for AI-powered movie recommendations
 */
@Configuration
@EnableRetry
public class OpenAIConfig {

    @Value("${spring.ai.openai.api-key}")
    private String openAiApiKey;

    /**
     * Configure OpenAI Service client
     * Uses official OpenAI Java client for embeddings and other AI operations
     */
    @Bean
    public OpenAiService openAiService() {
        return new OpenAiService(openAiApiKey, Duration.ofSeconds(60));
    }
}