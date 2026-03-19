package com.example.cinema.service;

import com.theokanning.openai.embedding.EmbeddingRequest;
import com.theokanning.openai.embedding.EmbeddingResult;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.util.List;
import static com.example.cinema.config.CacheConfig.*;

/**
 * Embedding Service - Generates vector embeddings using OpenAI
 *
 * Cache key strategy:
 * - generateMovieEmbedding: key = movieId + content hash
 *   → Khi title/genre/director thay đổi, hash thay đổi → cache miss → tự regenerate
 * - generateUserPreferenceEmbedding: key = userId + preferences version
 *   → Khi user đổi preferences/favorites → version tăng → cache miss → tự regenerate
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final OpenAiService openAiService;
    private static final String EMBEDDING_MODEL = "text-embedding-ada-002";

    /**
     * Generate raw text embedding - ĐÂY LÀ ĐIỂM GỌI OPENAI DUY NHẤT.
     *
     * Cache tại đây để tránh gọi OpenAI cho cùng một đoạn text:
     *   - generateMovieEmbedding() → gọi method này → cache hit nếu text giống nhau
     *   - semanticMovieSearch()    → gọi method này → cache hit nếu query giống nhau
     *
     * Cache key = contentHash(text) - stable hash của text đã clean
     * TTL: 30 ngày (movie embeddings ổn định) - chọn TTL dài nhất phù hợp
     *
     * NOTE: generateMovieEmbedding và generateUserPreferenceEmbedding có cache riêng
     * ở tầng cao hơn với key có ngữ nghĩa (movieId, userId). Cache tại đây là
     * safety net cho bất kỳ call nào đến generateEmbedding trực tiếp.
     */
    @Cacheable(value = MOVIE_EMBEDDINGS_CACHE,
               key = "'text:' + T(com.example.cinema.service.EmbeddingService).contentHash(#text, '', '')")
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
     * Generate embedding cho một bộ phim.
     *
     * Cache key = movieId + hash(title + genre + director)
     * → Khi nội dung phim thay đổi, hash thay đổi → cache key mới → cache miss
     *    → OpenAI được gọi lại → embedding mới được sinh và cache
     * → Key cũ trong Redis sẽ TTL-expire sau 30 ngày (không chiếm memory vĩnh viễn)
     *
     * KHÔNG dùng text.hashCode() vì:
     *   1. Java hashCode() không stable giữa các JVM restart
     *   2. Không encode được movieId → hai phim khác nhau có cùng text sẽ bị collision
     */
    @Cacheable(value = MOVIE_EMBEDDINGS_CACHE,
               key = "'movie:' + #movieId + ':v' + T(com.example.cinema.service.EmbeddingService).contentHash(#title, #genre, #director)")
    public List<Double> generateMovieEmbedding(Long movieId, String title, String description, String genre, String director) {
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
     * Generate embedding cho preferences của user.
     *
     * Cache key = userId + prefVersion + favVersion
     * prefVersion = hash(sorted list of "genre:score") → thay đổi khi user đổi preference
     * favVersion  = hash(sorted list of favorite movieIds) → thay đổi khi user thêm/xóa favorite
     *
     * → Cache tự miss khi sở thích user thay đổi, KHÔNG cần @CacheEvict thủ công
     * TTL 7 ngày: nếu user không hoạt động 7 ngày thì embedding cũ cũng không còn giá trị
     */
    @Cacheable(value = USER_PREFERENCE_EMBEDDING_CACHE,
               key = "'user:' + #userId + ':pref' + #prefVersion + ':fav' + #favVersion")
    public List<Double> generateUserPreferenceEmbedding(Long userId, int prefVersion, int favVersion,
                                                        List<String> preferredGenres, List<String> favoriteMovieTitles) {
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
                .replaceAll("\\s+", " ")
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "")
                .substring(0, Math.min(text.length(), 8000));
    }

    /**
     * Tạo stable hash từ các field nội dung phim dùng làm cache key version.
     * Dùng SHA-based approach thay vì Java hashCode() vì:
     *   - Java hashCode() không stable giữa các JVM restart
     *   - Cần deterministic hash để cache key nhất quán
     *
     * Trả về 8 ký tự hex đầu của hash → đủ ngắn cho Redis key, đủ unique.
     */
    public static String contentHash(String title, String genre, String director) {
        String raw = (title == null ? "" : title.toLowerCase().trim())
                   + "|" + (genre == null ? "" : genre.toLowerCase().trim())
                   + "|" + (director == null ? "" : director.toLowerCase().trim());
        // Dùng hashCode với seed cố định (không phụ thuộc JVM seed)
        int h = 0;
        for (char c : raw.toCharArray()) {
            h = 31 * h + c;
        }
        return String.format("%08x", h & 0xFFFFFFFFL);
    }

    /**
     * Tạo version int từ danh sách preferences của user dùng làm cache key version.
     * Sorted trước khi hash → thứ tự không ảnh hưởng.
     */
    public static int prefListVersion(List<String> items) {
        if (items == null || items.isEmpty()) return 0;
        List<String> sorted = items.stream().sorted().toList();
        int h = 0;
        for (String s : sorted) {
            h = 31 * h + s.toLowerCase().trim().hashCode();
        }
        return h & 0x7FFFFFFF; // positive int
    }
}