package com.example.cinema.controller;

import com.example.cinema.service.CacheManagementService;
import com.example.cinema.service.CacheMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cache Management Controller - Admin endpoints for cache management
 * Provides cache monitoring and control for AI Recommendation System
 */
@RestController
@RequestMapping("/api/admin/cache")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class CacheController {

    private final CacheManagementService cacheManagementService;
    private final CacheMonitoringService cacheMonitoringService;

    /**
     * Get cache statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<CacheManagementService.CacheStatistics> getCacheStatistics() {
        log.info("Admin requested cache statistics");
        CacheManagementService.CacheStatistics stats = cacheManagementService.getCacheStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get cache performance metrics (hit rate, etc.)
     */
    @GetMapping("/metrics")
    public ResponseEntity<CacheMonitoringService.CachePerformanceMetrics> getCacheMetrics() {
        log.info("Admin requested cache performance metrics");
        CacheMonitoringService.CachePerformanceMetrics metrics =
            cacheMonitoringService.getPerformanceMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Clear all AI-related caches
     */
    @PostMapping("/clear-all")
    public ResponseEntity<CacheClearResponse> clearAllCaches() {
        log.warn("Admin clearing all AI recommendation caches");
        cacheManagementService.clearAllCaches();
        return ResponseEntity.ok(new CacheClearResponse(
            "All AI recommendation caches cleared successfully",
            System.currentTimeMillis()
        ));
    }

    /**
     * Evict user-specific recommendation caches
     */
    @PostMapping("/users/{userId}/evict")
    public ResponseEntity<CacheClearResponse> evictUserCaches(@PathVariable Long userId) {
        log.info("Admin evicting caches for user: {}", userId);
        cacheManagementService.evictUserRecommendationCaches(userId);
        return ResponseEntity.ok(new CacheClearResponse(
            "User recommendation caches evicted for user: " + userId,
            System.currentTimeMillis()
        ));
    }

    /**
     * Evict movie-specific caches
     */
    @PostMapping("/movies/{movieId}/evict")
    public ResponseEntity<CacheClearResponse> evictMovieCaches(@PathVariable Long movieId) {
        log.info("Admin evicting caches for movie: {}", movieId);
        cacheManagementService.evictMovieCaches(movieId);
        return ResponseEntity.ok(new CacheClearResponse(
            "Movie-related caches evicted for movie: " + movieId,
            System.currentTimeMillis()
        ));
    }

    /**
     * Evict semantic search cache only
     */
    @PostMapping("/semantic-search/evict")
    public ResponseEntity<CacheClearResponse> evictSemanticSearchCache() {
        log.info("Admin evicting semantic search cache");
        cacheManagementService.evictSemanticSearchCache();
        return ResponseEntity.ok(new CacheClearResponse(
            "Semantic search cache evicted successfully",
            System.currentTimeMillis()
        ));
    }

    /**
     * Evict embedding statistics cache
     */
    @PostMapping("/embedding-stats/evict")
    public ResponseEntity<CacheClearResponse> evictEmbeddingStatsCache() {
        log.info("Admin evicting embedding statistics cache");
        cacheManagementService.evictEmbeddingStatsCache();
        return ResponseEntity.ok(new CacheClearResponse(
            "Embedding statistics cache evicted successfully",
            System.currentTimeMillis()
        ));
    }

    /**
     * Trigger manual cache warm-up
     */
    @PostMapping("/warmup")
    public ResponseEntity<CacheClearResponse> triggerManualWarmup() {
        log.info("Admin triggered manual cache warm-up");
        cacheMonitoringService.scheduledCacheWarmup();
        return ResponseEntity.ok(new CacheClearResponse(
            "Manual cache warm-up completed",
            System.currentTimeMillis()
        ));
    }

    /**
     * Evict all AI caches (movie updates, embeddings, recommendations)
     */
    @PostMapping("/ai/evict-all")
    public ResponseEntity<CacheClearResponse> evictAllAICaches() {
        log.warn("Admin evicting all AI-related caches");
        cacheManagementService.evictAllAICaches();
        return ResponseEntity.ok(new CacheClearResponse(
            "All AI-related caches evicted successfully",
            System.currentTimeMillis()
        ));
    }

    // DTOs
    public record CacheClearResponse(
        String message,
        long timestamp
    ) {}
}

