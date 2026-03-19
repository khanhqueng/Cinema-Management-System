package com.example.cinema.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import static com.example.cinema.config.CacheConfig.*;

/**
 * Cache Management Service - Centralized eviction logic
 *
 * Phân loại eviction:
 *
 * 1. SELF-INVALIDATING (KHÔNG cần evict thủ công):
 *    - User preference embedding: key encode prefVersion+favVersion
 *      → tự miss khi sở thích thay đổi
 *    - Genre/Search recommendations: key encode LocalDate.now()
 *      → tự miss sang ngày mới
 *
 * 2. EVENT-DRIVEN EVICTION (cần evict khi có sự kiện):
 *    - Movie embedding: evict khi title/genre/director thay đổi
 *    - Similar movies: evict khi có phim mới hoặc batch embedding xong
 *    - Semantic search: evict khi có phim mới thêm vào hệ thống
 *    - AI recommendations: evict khi admin cập nhật lịch chiếu (showtime)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheManagementService {

    private final CacheManager cacheManager;

    // ─────────────────────────────────────────────────────────────
    // Evict khi NỘI DUNG PHIM thay đổi (title, genre, director)
    // ─────────────────────────────────────────────────────────────

    /**
     * Gọi khi movie được update (title/genre/director/description thay đổi).
     * Evict embedding cache → lần sau generateMovieEmbedding sẽ gọi lại OpenAI
     * với key mới (vì contentHash thay đổi) rồi cache kết quả mới.
     */
    @CacheEvict(value = {MOVIE_EMBEDDINGS_CACHE, SIMILAR_MOVIES_CACHE}, allEntries = true)
    public void onMovieContentChanged(Long movieId) {
        log.info("[Cache] Movie {} content changed → evict embeddings & similar-movies", movieId);
    }

    /**
     * Gọi khi movie bị xóa khỏi hệ thống.
     * Phim bị xóa ảnh hưởng đến tất cả kết quả AI → clear rộng hơn.
     */
    @CacheEvict(value = {
        MOVIE_EMBEDDINGS_CACHE,
        SIMILAR_MOVIES_CACHE,
        SEMANTIC_SEARCH_CACHE,
        AI_RECOMMENDATIONS_CACHE,
        RECOMMENDATION_RESULTS_CACHE,
        GENRE_RECOMMENDATIONS_CACHE
    }, allEntries = true)
    public void onMovieDeleted(Long movieId) {
        log.info("[Cache] Movie {} deleted → evict all content-dependent caches", movieId);
    }

    // ─────────────────────────────────────────────────────────────
    // Evict khi PHIM MỚI được thêm vào (ảnh hưởng search & recs)
    // ─────────────────────────────────────────────────────────────

    /**
     * Gọi khi phim mới được thêm vào hệ thống.
     * Phim mới có thể xuất hiện trong kết quả search và recommendations.
     * NOTE: genre/date-based recs tự miss qua key date → không cần evict.
     */
    @CacheEvict(value = {SEMANTIC_SEARCH_CACHE, EMBEDDING_STATS_CACHE}, allEntries = true)
    public void onMovieAdded() {
        log.info("[Cache] New movie added → evict semantic-search & stats");
    }

    // ─────────────────────────────────────────────────────────────
    // Evict khi BATCH EMBEDDING hoàn tất
    // ─────────────────────────────────────────────────────────────

    /**
     * Gọi sau khi generateEmbeddingsForAllMovies() hoàn tất.
     * Nhiều embedding mới → similar-movies và search sẽ có kết quả mới.
     */
    @CacheEvict(value = {
        SIMILAR_MOVIES_CACHE,
        SEMANTIC_SEARCH_CACHE,
        AI_RECOMMENDATIONS_CACHE,
        EMBEDDING_STATS_CACHE
    }, allEntries = true)
    public void onBatchEmbeddingCompleted() {
        log.info("[Cache] Batch embedding done → evict similarity & search caches");
    }

    // ─────────────────────────────────────────────────────────────
    // Evict khi LỊCH CHIẾU (SHOWTIME) thay đổi
    // ─────────────────────────────────────────────────────────────

    /**
     * Gọi khi admin cập nhật lịch chiếu.
     * Recommendations "phim đang chiếu" phụ thuộc vào showtime → cần refresh.
     * NOTE: genre/search recs có key date → tự miss ngày mới, nhưng evict ngay
     *       khi showtime thay đổi giữa ngày để user thấy lịch mới tức thì.
     */
    @CacheEvict(value = {
        AI_RECOMMENDATIONS_CACHE,
        RECOMMENDATION_RESULTS_CACHE,
        SHOWTIME_AWARE_RECS_CACHE,
        GENRE_RECOMMENDATIONS_CACHE
    }, allEntries = true)
    public void onShowtimeChanged() {
        log.info("[Cache] Showtime changed → evict recommendation caches");
    }

    // ─────────────────────────────────────────────────────────────
    // Admin / Manual clear
    // ─────────────────────────────────────────────────────────────

    @CacheEvict(value = {
        MOVIE_EMBEDDINGS_CACHE, AI_RECOMMENDATIONS_CACHE, SEMANTIC_SEARCH_CACHE,
        SIMILAR_MOVIES_CACHE, USER_PREFERENCE_EMBEDDING_CACHE, RECOMMENDATION_RESULTS_CACHE,
        EMBEDDING_STATS_CACHE, GENRE_RECOMMENDATIONS_CACHE, SHOWTIME_AWARE_RECS_CACHE
    }, allEntries = true)
    public void clearAllCaches() {
        log.warn("[Cache] Admin cleared ALL caches");
    }

    @CacheEvict(value = SEMANTIC_SEARCH_CACHE, allEntries = true)
    public void evictSemanticSearchCache() {
        log.info("[Cache] Evicted semantic-search cache");
    }

    @CacheEvict(value = EMBEDDING_STATS_CACHE, allEntries = true)
    public void evictEmbeddingStatsCache() {
        log.info("[Cache] Evicted embedding-stats cache");
    }

    public void evictMovieCaches(Long movieId) {
        onMovieContentChanged(movieId);
    }

    /**
     * Evict AI recommendation cache cho một user cụ thể.
     * Gọi khi user thêm/xóa favorite hoặc cập nhật preferences.
     *
     * NOTE: embedding của user (USER_PREFERENCE_EMBEDDING_CACHE) tự miss
     * thông qua versioned key (prefVersion+favVersion) - không cần evict.
     * Chỉ cần evict AI_RECOMMENDATIONS_CACHE để force recalculate.
     */
    @CacheEvict(value = AI_RECOMMENDATIONS_CACHE, allEntries = true)
    public void evictUserRecommendationCaches(Long userId) {
        log.info("[Cache] User {} changed preferences/favorites → evict AI recommendations", userId);
    }

    /** Alias cho backward compat */
    public void evictAllAICaches() {
        clearAllCaches();
    }

    // ─────────────────────────────────────────────────────────────
    // Monitoring
    // ─────────────────────────────────────────────────────────────

    public CacheStatistics getCacheStatistics() {
        CacheStatistics s = new CacheStatistics();
        s.movieEmbeddingsCachePresent    = isCachePresent(MOVIE_EMBEDDINGS_CACHE);
        s.aiRecommendationsCachePresent  = isCachePresent(AI_RECOMMENDATIONS_CACHE);
        s.semanticSearchCachePresent     = isCachePresent(SEMANTIC_SEARCH_CACHE);
        s.similarMoviesCachePresent      = isCachePresent(SIMILAR_MOVIES_CACHE);
        s.showtimeAwareRecsCachePresent  = isCachePresent(SHOWTIME_AWARE_RECS_CACHE);
        return s;
    }

    private boolean isCachePresent(String name) {
        return cacheManager.getCache(name) != null;
    }

    public static class CacheStatistics {
        public boolean movieEmbeddingsCachePresent;
        public boolean aiRecommendationsCachePresent;
        public boolean semanticSearchCachePresent;
        public boolean similarMoviesCachePresent;
        public boolean showtimeAwareRecsCachePresent;

        @Override
        public String toString() {
            return "CacheStatistics{movieEmbeddings=" + movieEmbeddingsCachePresent
                 + ", aiRecommendations=" + aiRecommendationsCachePresent
                 + ", semanticSearch=" + semanticSearchCachePresent
                 + ", similarMovies=" + similarMoviesCachePresent
                 + ", showtimeAwareRecs=" + showtimeAwareRecsCachePresent + '}';
        }
    }
}

