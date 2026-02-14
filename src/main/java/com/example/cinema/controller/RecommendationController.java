package com.example.cinema.controller;

import com.example.cinema.entity.User;
import com.example.cinema.service.RecommendationService;
import com.example.cinema.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Recommendation Controller - API endpoints for movie recommendations
 * Provides personalized movie recommendations based on user preferences and behavior
 */
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    /**
     * Get personalized recommendations for current user
     * Now enhanced with AI-powered recommendations
     */
    @GetMapping("/for-me")
    public ResponseEntity<RecommendationService.RecommendationResponse> getPersonalizedRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "true") boolean useAI) {
        User currentUser = userService.getCurrentUser();

        RecommendationService.RecommendationResponse recommendations;

        if (useAI) {
            // Try AI recommendations first, fallback to traditional if needed
            recommendations = recommendationService.getAIPersonalizedRecommendations(currentUser.getId(), limit);
            if (recommendations.movies().isEmpty()) {
                recommendations = recommendationService.getPersonalizedRecommendations(currentUser.getId(), limit);
            }
        } else {
            // Traditional recommendations only
            recommendations = recommendationService.getPersonalizedRecommendations(currentUser.getId(), limit);
        }

        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get movies similar to user's favorites
     */
    @GetMapping("/similar-to-favorites")
    public ResponseEntity<RecommendationService.RecommendationResponse> getSimilarToFavorites(
            @RequestParam(defaultValue = "10") int limit) {
        User currentUser = userService.getCurrentUser();
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.getSimilarToFavorites(currentUser.getId(), limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get recommendations for new users
     */
    @GetMapping("/new-user")
    public ResponseEntity<RecommendationService.RecommendationResponse> getNewUserRecommendations(
            @RequestParam(defaultValue = "15") int limit) {
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.getNewUserRecommendations(limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get recommendations by specific genre
     */
    @GetMapping("/by-genre/{genre}")
    public ResponseEntity<RecommendationService.RecommendationResponse> getRecommendationsByGenre(
            @PathVariable String genre,
            @RequestParam(defaultValue = "10") int limit) {
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.getRecommendationsByGenre(genre, limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get mixed recommendations (multiple sections)
     */
    @GetMapping("/mixed")
    public ResponseEntity<RecommendationService.MixedRecommendationResponse> getMixedRecommendations(
            @RequestParam(defaultValue = "20") int limit) {
        User currentUser = userService.getCurrentUser();
        RecommendationService.MixedRecommendationResponse recommendations =
                recommendationService.getMixedRecommendations(currentUser.getId(), limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get homepage recommendations (mixed format for homepage display)
     */
    @GetMapping("/homepage")
    public ResponseEntity<RecommendationService.MixedRecommendationResponse> getHomepageRecommendations() {
        User currentUser = userService.getCurrentUser();
        RecommendationService.MixedRecommendationResponse recommendations =
                recommendationService.getMixedRecommendations(currentUser.getId(), 25);
        return ResponseEntity.ok(recommendations);
    }

    // ================================
    // AI-POWERED RECOMMENDATION ENDPOINTS
    // ================================

    /**
     * Get AI-powered personalized recommendations
     */
    @GetMapping("/ai-personalized")
    public ResponseEntity<RecommendationService.RecommendationResponse> getAIPersonalizedRecommendations(
            @RequestParam(defaultValue = "12") int limit) {
        User currentUser = userService.getCurrentUser();
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.getAIPersonalizedRecommendations(currentUser.getId(), limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Find movies similar to a specific movie using AI
     */
    @GetMapping("/similar-movies/{movieId}")
    public ResponseEntity<RecommendationService.RecommendationResponse> findSimilarMovies(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "12") int limit) {
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.findSimilarMovies(movieId, limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Semantic search for movies using natural language
     */
    @GetMapping("/semantic-search")
    public ResponseEntity<RecommendationService.RecommendationResponse> semanticMovieSearch(
            @RequestParam String query,
            @RequestParam(defaultValue = "12") int limit) {
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.semanticMovieSearch(query, limit);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get personalized recommendations (traditional approach)
     */
    @GetMapping("/personalized")
    public ResponseEntity<RecommendationService.RecommendationResponse> getPersonalizedRecommendationsTraditional(
            @RequestParam(defaultValue = "12") int limit) {
        User currentUser = userService.getCurrentUser();
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.getPersonalizedRecommendations(currentUser.getId(), limit);
        return ResponseEntity.ok(recommendations);
    }
}