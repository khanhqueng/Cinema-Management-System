package com.example.cinema.service;

import com.theokanning.openai.embedding.EmbeddingRequest;
import com.theokanning.openai.embedding.EmbeddingResult;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Embedding Service - Generates vector embeddings using OpenAI
 * Handles text-to-vector conversion for movie content and user preferences
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final OpenAiService openAiService;
    private static final String EMBEDDING_MODEL = "text-embedding-ada-002";

    /**
     * Generate embedding vector for a single text
     * Uses OpenAI's text-embedding-ada-002 model (1536 dimensions)
     */
    @Retryable(
        retryFor = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public List<Double> generateEmbedding(String text) {
        try {
            log.debug("Generating embedding for text: {} characters", text.length());

            if (text == null || text.trim().isEmpty()) {
                throw new IllegalArgumentException("Text cannot be null or empty");
            }

            // Clean and prepare text
            String cleanedText = cleanText(text);

            // Create embedding request
            EmbeddingRequest request = EmbeddingRequest.builder()
                    .model(EMBEDDING_MODEL)
                    .input(List.of(cleanedText))
                    .build();

            // Generate embedding
            EmbeddingResult result = openAiService.createEmbeddings(request);

            if (result.getData().isEmpty()) {
                throw new RuntimeException("No embedding generated for text");
            }

            List<Double> embedding = result.getData().get(0).getEmbedding();

            log.debug("Successfully generated embedding with {} dimensions", embedding.size());
            return embedding;

        } catch (Exception e) {
            log.error("Error generating embedding for text: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate embedding: " + e.getMessage(), e);
        }
    }

    /**
     * Generate embedding for a movie based on its content
     * Combines title, description, genre, and director for comprehensive representation
     */
    public List<Double> generateMovieEmbedding(String title, String description, String genre, String director) {
        // Create comprehensive text representation of the movie
        StringBuilder movieText = new StringBuilder();

        if (title != null && !title.trim().isEmpty()) {
            movieText.append("Title: ").append(title.trim()).append(". ");
        }

        if (description != null && !description.trim().isEmpty()) {
            movieText.append("Description: ").append(description.trim()).append(". ");
        }

        if (genre != null && !genre.trim().isEmpty()) {
            movieText.append("Genre: ").append(genre.trim()).append(". ");
        }

        if (director != null && !director.trim().isEmpty()) {
            movieText.append("Director: ").append(director.trim()).append(".");
        }

        String finalText = movieText.toString().trim();

        if (finalText.isEmpty()) {
            throw new IllegalArgumentException("Movie must have at least title or description");
        }

        log.debug("Generating embedding for movie: {}", title);
        return generateEmbedding(finalText);
    }

    /**
     * Generate embedding for user preferences based on selected genres
     * Creates a preference vector representing user's movie tastes
     */
    public List<Double> generateUserPreferenceEmbedding(List<String> preferredGenres, List<String> favoriteMovieTitles) {
        StringBuilder preferenceText = new StringBuilder();

        if (preferredGenres != null && !preferredGenres.isEmpty()) {
            preferenceText.append("User prefers these movie genres: ");
            preferenceText.append(String.join(", ", preferredGenres));
            preferenceText.append(". ");
        }

        if (favoriteMovieTitles != null && !favoriteMovieTitles.isEmpty()) {
            preferenceText.append("User likes these movies: ");
            preferenceText.append(String.join(", ", favoriteMovieTitles));
            preferenceText.append(".");
        }

        String finalText = preferenceText.toString().trim();

        if (finalText.isEmpty()) {
            // Default preference if no specific preferences
            finalText = "User enjoys watching movies";
        }

        log.debug("Generating preference embedding for user with {} genres and {} favorite movies",
                 preferredGenres != null ? preferredGenres.size() : 0,
                 favoriteMovieTitles != null ? favoriteMovieTitles.size() : 0);

        return generateEmbedding(finalText);
    }

    /**
     * Convert List<Double> to float[] for database storage
     * pgvector requires float[] format
     */
    public float[] convertToFloatArray(List<Double> doubleList) {
        if (doubleList == null) {
            return new float[0];
        }

        float[] result = new float[doubleList.size()];
        for (int i = 0; i < doubleList.size(); i++) {
            result[i] = doubleList.get(i).floatValue();
        }
        return result;
    }

    /**
     * Calculate cosine similarity between two embedding vectors
     * Returns value between -1 (opposite) and 1 (identical)
     */
    public double calculateCosineSimilarity(List<Double> vectorA, List<Double> vectorB) {
        if (vectorA.size() != vectorB.size()) {
            throw new IllegalArgumentException("Vector dimensions must match");
        }

        double dotProduct = 0.0;
        double magnitudeA = 0.0;
        double magnitudeB = 0.0;

        for (int i = 0; i < vectorA.size(); i++) {
            double valA = vectorA.get(i);
            double valB = vectorB.get(i);

            dotProduct += valA * valB;
            magnitudeA += valA * valA;
            magnitudeB += valB * valB;
        }

        if (magnitudeA == 0.0 || magnitudeB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }

    /**
     * Clean and normalize text before embedding generation
     */
    private String cleanText(String text) {
        if (text == null) {
            return "";
        }

        return text
                .trim()
                .replaceAll("\\s+", " ")  // Replace multiple whitespace with single space
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "") // Remove control characters
                .substring(0, Math.min(text.length(), 8000)); // Limit length to avoid API limits
    }
}