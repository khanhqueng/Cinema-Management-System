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
     */
    @GetMapping("/for-me")
    public ResponseEntity<RecommendationService.RecommendationResponse> getPersonalizedRecommendations(
            @RequestParam(defaultValue = "10") int limit) {
        User currentUser = userService.getCurrentUser();
        RecommendationService.RecommendationResponse recommendations =
                recommendationService.getPersonalizedRecommendations(currentUser.getId(), limit);
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
}