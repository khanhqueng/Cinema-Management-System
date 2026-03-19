package com.example.cinema.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Cache Monitoring and Warm-up Service
 * Monitors cache performance and pre-populates hot data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheMonitoringService {

    private final CacheManagementService cacheManagementService;
    private final RecommendationService recommendationService;
    private final MovieService movieService;

    // Performance metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong cacheHits = new AtomicLong(0);
    private final AtomicLong cacheMisses = new AtomicLong(0);
    private LocalDateTime lastResetTime = LocalDateTime.now();

    /**
     * Scheduled cache warm-up
     * Runs every 6 hours to pre-populate popular queries
     */
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000, initialDelay = 60 * 1000) // 6 hours, start after 1 minute
    public void scheduledCacheWarmup() {
        log.info("=== Starting scheduled cache warm-up ===");

        try {
            // Warm up popular movie genres
            warmupGenreRecommendations();

            // Warm up popular search queries
            warmupPopularSearches();

            log.info("=== Cache warm-up completed successfully ===");

        } catch (Exception e) {
            log.error("Cache warm-up failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Warm up genre recommendations cache
     */
    private void warmupGenreRecommendations() {
        String[] popularGenres = {"Action", "Comedy", "Drama", "Thriller", "Romance", "Sci-Fi", "Horror"};

        log.info("Warming up genre recommendations for {} genres", popularGenres.length);

        for (String genre : popularGenres) {
            try {
                recommendationService.getRecommendationsByGenre(genre, 12);
                log.debug("Warmed up cache for genre: {}", genre);
                Thread.sleep(200); // Small delay to avoid overwhelming system
            } catch (Exception e) {
                log.warn("Failed to warm up cache for genre {}: {}", genre, e.getMessage());
            }
        }
    }

    /**
     * Warm up popular semantic search queries
     */
    private void warmupPopularSearches() {
        String[] popularQueries = {
            "action movies with superheroes",
            "romantic comedy films",
            "sci-fi space adventures",
            "thriller mystery movies",
            "family friendly animations"
        };

        log.info("Warming up semantic search cache for {} popular queries", popularQueries.length);

        for (String query : popularQueries) {
            try {
                recommendationService.semanticMovieSearch(query, 12);
                log.debug("Warmed up cache for query: {}", query);
                Thread.sleep(500); // Delay to avoid rate limits
            } catch (Exception e) {
                log.warn("Failed to warm up cache for query '{}': {}", query, e.getMessage());
            }
        }
    }

    /**
     * Log cache performance metrics
     * Runs every hour
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // Every hour
    public void logCacheMetrics() {
        try {
            CacheManagementService.CacheStatistics stats = cacheManagementService.getCacheStatistics();

            log.info("=== Cache Performance Metrics ===");
            log.info("Cache Status: {}", stats);

            if (totalRequests.get() > 0) {
                double hitRate = (double) cacheHits.get() / totalRequests.get() * 100;
                log.info("Cache Hit Rate: {:.2f}% ({}/{})",
                    hitRate, cacheHits.get(), totalRequests.get());

                if (hitRate < 50) {
                    log.warn("⚠️ Cache hit rate is below 50% - consider adjusting TTL or warm-up strategy");
                }
            }

            log.info("Time since last reset: {}", java.time.Duration.between(lastResetTime, LocalDateTime.now()));
            log.info("===================================");

        } catch (Exception e) {
            log.error("Failed to log cache metrics: {}", e.getMessage());
        }
    }

    /**
     * Clean up old semantic search cache entries
     * Runs daily at 3 AM
     */
    @Scheduled(cron = "0 0 3 * * *") // Daily at 3 AM
    public void scheduledSemanticSearchCleanup() {
        log.info("Running scheduled semantic search cache cleanup");
        try {
            cacheManagementService.evictSemanticSearchCache();
            log.info("Semantic search cache cleaned successfully");
        } catch (Exception e) {
            log.error("Failed to clean semantic search cache: {}", e.getMessage());
        }
    }

    /**
     * Reset performance counters
     * Runs daily at midnight
     */
    @Scheduled(cron = "0 0 0 * * *") // Daily at midnight
    public void resetPerformanceCounters() {
        log.info("Resetting cache performance counters");
        totalRequests.set(0);
        cacheHits.set(0);
        cacheMisses.set(0);
        lastResetTime = LocalDateTime.now();
    }

    // Public methods for tracking (can be called from interceptors/aspects)

    public void recordCacheHit() {
        totalRequests.incrementAndGet();
        cacheHits.incrementAndGet();
    }

    public void recordCacheMiss() {
        totalRequests.incrementAndGet();
        cacheMisses.incrementAndGet();
    }

    public CachePerformanceMetrics getPerformanceMetrics() {
        long total = totalRequests.get();
        long hits = cacheHits.get();
        long misses = cacheMisses.get();

        double hitRate = total > 0 ? (double) hits / total * 100 : 0.0;

        return new CachePerformanceMetrics(
            total,
            hits,
            misses,
            hitRate,
            lastResetTime
        );
    }

    // DTO
    public record CachePerformanceMetrics(
        long totalRequests,
        long cacheHits,
        long cacheMisses,
        double hitRatePercentage,
        LocalDateTime lastResetTime
    ) {}
}

