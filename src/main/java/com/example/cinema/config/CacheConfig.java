package com.example.cinema.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache Configuration - Cinema Domain Aware Caching Strategy
 *
 * Nguyên tắc thiết kế:
 * 1. Cache key phải encode đầy đủ những gì ảnh hưởng đến kết quả
 *    → Khi key thay đổi (do data thay đổi), cache tự miss → tự regenerate
 * 2. TTL phải phù hợp với vòng đời thực tế của rạp phim:
 *    - Embedding của phim: KHÔNG BAO GIỜ hết hạn (chỉ evict khi nội dung phim đổi)
 *    - Lịch chiếu (showtime): hết hạn theo ngày
 *    - Gợi ý phim đang chiếu: hết hạn theo ngày (phim đang chiếu thay đổi theo ngày)
 *    - Sở thích user: hết hạn dài (user ít khi đổi sở thích đột ngột)
 *    - Semantic search: hết hạn trung bình (phim mới ra sẽ thay đổi kết quả)
 */
@Configuration
@EnableCaching
@Slf4j
public class CacheConfig implements CachingConfigurer {

    // =====================================================================
    // Chỉ cache những gì GỌI OPENAI - 3 cache regions duy nhất
    // =====================================================================

    /**
     * CACHE 1: Embedding của từng bộ phim
     * Tốn kém: ~$0.0001/request, 1536 chiều float
     * Key: movieId + contentHash(title, genre, director)
     *   → Tự miss khi nội dung phim thay đổi
     * TTL: 30 ngày (safety net) - thực tế evict khi phim được update/xóa
     */
    public static final String MOVIE_EMBEDDINGS_CACHE = "movieEmbeddings";

    /**
     * CACHE 2: AI Personalized Recommendations của user
     * Tốn kém: gọi generateUserPreferenceEmbedding() → OpenAI API
     * Key: userId + limit
     * Self-invalidating: bên trong gọi generateUserPreferenceEmbedding với
     *   key (userId, prefVersion, favVersion) → khi sở thích đổi → embedding miss
     *   → embedding mới → recommendation mới (cache này sẽ được evict thủ công
     *   qua onShowtimeChanged khi admin update lịch chiếu)
     * TTL: 12h - tươi mỗi ngày, phù hợp chu kỳ lịch chiếu
     */
    public static final String AI_RECOMMENDATIONS_CACHE = "aiRecommendations";

    /**
     * CACHE 3: Semantic Search
     * Tốn kém: gọi generateEmbedding(query) → OpenAI API
     * Key: query + LocalDate.now() + limit
     *   → Tự miss sang ngày mới (phim mới đang chiếu xuất hiện)
     *   → Cùng query trong ngày → cache hit
     * TTL: 24h (backup, key date đã tự expire)
     */
    public static final String SEMANTIC_SEARCH_CACHE = "semanticSearch";

    /**
     * CACHE 4: User Preference Embedding
     * Tốn kém: gọi OpenAI API để tạo user vector
     * Key: userId + prefVersion + favVersion
     *   → Tự miss khi preferences/favorites thay đổi
     * TTL: 7 ngày - user ít khi đổi sở thích đột ngột
     */
    public static final String USER_PREFERENCE_EMBEDDING_CACHE = "userPreferenceEmbedding";

    // ── Giữ lại các constant cho backward compat với CacheManagementService ──
    // Các cache dưới đây KHÔNG còn được @Cacheable sử dụng,
    // nhưng giữ constant để CacheManagementService dùng trong eviction.
    public static final String SIMILAR_MOVIES_CACHE         = "similarMovies";
    public static final String RECOMMENDATION_RESULTS_CACHE = "recommendationResults";
    public static final String EMBEDDING_STATS_CACHE        = "embeddingStats";
    public static final String GENRE_RECOMMENDATIONS_CACHE  = "genreRecommendations";
    public static final String SHOWTIME_AWARE_RECS_CACHE    = "showtimeAwareRecs";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );

        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer(objectMapper)))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> configs = new HashMap<>();

        // CACHE 1 – Movie Embedding: 30 ngày safety-net
        // Evict chủ động khi title/genre/director thay đổi
        configs.put(MOVIE_EMBEDDINGS_CACHE, base.entryTtl(Duration.ofDays(30)));

        // CACHE 2 – AI Recommendations: 12h
        // Evict khi admin update showtime, phù hợp chu kỳ cập nhật lịch chiếu
        configs.put(AI_RECOMMENDATIONS_CACHE, base.entryTtl(Duration.ofHours(12)));

        // CACHE 3 – Semantic Search: 24h
        // Key đã encode date → tự miss sang ngày mới
        configs.put(SEMANTIC_SEARCH_CACHE, base.entryTtl(Duration.ofHours(24)));

        // CACHE 4 – User Preference Embedding: 7 ngày
        // Key encode prefVersion+favVersion → tự miss khi preferences đổi
        configs.put(USER_PREFERENCE_EMBEDDING_CACHE, base.entryTtl(Duration.ofDays(7)));

        log.info("[Cache] {} active cache regions (OpenAI-cost caches only): {}",
                 configs.size(), configs.keySet());

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(base.entryTtl(Duration.ofHours(1)))
                .withInitialCacheConfigurations(configs)
                .transactionAware()
                .build();
    }

    @Bean
    @Override
    public KeyGenerator keyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName())
              .append(".").append(method.getName()).append(":");
            for (Object p : params) {
                sb.append(p != null ? p : "null").append(",");
            }
            return sb.toString();
        };
    }

    @Bean
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, org.springframework.cache.Cache c, Object k) {
                log.error("[Cache] GET error cache='{}' key='{}': {}", c.getName(), k, e.getMessage());
            }
            @Override
            public void handleCachePutError(RuntimeException e, org.springframework.cache.Cache c, Object k, Object v) {
                log.error("[Cache] PUT error cache='{}' key='{}': {}", c.getName(), k, e.getMessage());
            }
            @Override
            public void handleCacheEvictError(RuntimeException e, org.springframework.cache.Cache c, Object k) {
                log.error("[Cache] EVICT error cache='{}' key='{}': {}", c.getName(), k, e.getMessage());
            }
            @Override
            public void handleCacheClearError(RuntimeException e, org.springframework.cache.Cache c) {
                log.error("[Cache] CLEAR error cache='{}': {}", c.getName(), e.getMessage());
            }
        };
    }
}

