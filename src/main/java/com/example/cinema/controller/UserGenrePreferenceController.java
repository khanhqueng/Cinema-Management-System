package com.example.cinema.controller;

import com.example.cinema.entity.User;
import com.example.cinema.entity.UserGenrePreference;
import com.example.cinema.service.MovieService;
import com.example.cinema.service.UserGenrePreferenceService;
import com.example.cinema.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * UserGenrePreference Controller - API endpoints for managing user's genre preferences
 * Allows users to set and manage their movie genre preferences for personalized recommendations
 */
@RestController
@RequestMapping("/api/preferences/genres")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserGenrePreferenceController {

    private final UserGenrePreferenceService preferenceService;
    private final MovieService movieService;
    private final UserService userService;

    /**
     * Get all available genres in the system
     */
    @GetMapping("/available")
    public ResponseEntity<List<String>> getAvailableGenres() {
        List<String> genres = movieService.getAllGenres();
        return ResponseEntity.ok(genres);
    }

    /**
     * Get current user's genre preferences
     */
    @GetMapping("/my-preferences")
    public ResponseEntity<List<UserGenrePreference>> getMyGenrePreferences() {
        User currentUser = userService.getCurrentUser();
        List<UserGenrePreference> preferences = preferenceService.getUserGenrePreferences(currentUser.getId());
        return ResponseEntity.ok(preferences);
    }

    /**
     * Get current user's high preference genres
     */
    @GetMapping("/my-preferences/high")
    public ResponseEntity<List<UserGenrePreference>> getMyHighPreferences() {
        User currentUser = userService.getCurrentUser();
        List<UserGenrePreference> highPreferences = preferenceService.getHighPreferenceGenres(currentUser.getId());
        return ResponseEntity.ok(highPreferences);
    }

    /**
     * Get current user's preferred genre names
     */
    @GetMapping("/my-preferences/names")
    public ResponseEntity<List<String>> getMyPreferredGenreNames(
            @RequestParam(defaultValue = "4") Integer minScore) {
        User currentUser = userService.getCurrentUser();
        List<String> genreNames = preferenceService.getPreferredGenreNames(currentUser.getId(), minScore);
        return ResponseEntity.ok(genreNames);
    }

    /**
     * Get current user's top preferred genres
     */
    @GetMapping("/my-preferences/top/{limit}")
    public ResponseEntity<List<String>> getMyTopPreferences(@PathVariable int limit) {
        User currentUser = userService.getCurrentUser();
        List<String> topGenres = preferenceService.getTopPreferredGenres(currentUser.getId(), limit);
        return ResponseEntity.ok(topGenres);
    }

    /**
     * Set preference for a specific genre
     */
    @PostMapping("/set")
    public ResponseEntity<UserGenrePreference> setGenrePreference(
            @Valid @RequestBody SetPreferenceRequest request) {
        User currentUser = userService.getCurrentUser();
        UserGenrePreference preference = preferenceService.setGenrePreference(
                currentUser.getId(), request.genre(), request.score());
        return ResponseEntity.ok(preference);
    }

    /**
     * Set multiple genre preferences at once
     */
    @PostMapping("/set-multiple")
    public ResponseEntity<List<UserGenrePreference>> setMultiplePreferences(
            @Valid @RequestBody SetMultiplePreferencesRequest request) {
        User currentUser = userService.getCurrentUser();
        List<UserGenrePreference> preferences = preferenceService.setMultipleGenrePreferences(
                currentUser.getId(), request.genreScores());
        return ResponseEntity.ok(preferences);
    }

    /**
     * Initialize preferences with selected favorite genres
     */
    @PostMapping("/initialize")
    public ResponseEntity<List<UserGenrePreference>> initializePreferences(
            @Valid @RequestBody InitializePreferencesRequest request) {
        User currentUser = userService.getCurrentUser();
        List<UserGenrePreference> preferences = preferenceService.initializeUserPreferences(
                currentUser.getId(), request.preferredGenres());
        return ResponseEntity.ok(preferences);
    }

    /**
     * Update preference score for specific genre
     */
    @PutMapping("/update/{genre}")
    public ResponseEntity<UserGenrePreference> updatePreference(
            @PathVariable String genre,
            @Valid @RequestBody UpdatePreferenceRequest request) {
        User currentUser = userService.getCurrentUser();
        UserGenrePreference preference = preferenceService.updatePreferenceScore(
                currentUser.getId(), genre, request.score());
        return ResponseEntity.ok(preference);
    }

    /**
     * Remove preference for specific genre
     */
    @DeleteMapping("/remove/{genre}")
    public ResponseEntity<Void> removePreference(@PathVariable String genre) {
        User currentUser = userService.getCurrentUser();
        preferenceService.removeGenrePreference(currentUser.getId(), genre);
        return ResponseEntity.ok().build();
    }

    /**
     * Check if current user has preference for specific genre
     */
    @GetMapping("/check/{genre}")
    public ResponseEntity<PreferenceCheckResponse> checkPreference(@PathVariable String genre) {
        User currentUser = userService.getCurrentUser();
        boolean hasPreference = preferenceService.hasGenrePreference(currentUser.getId(), genre);
        Integer score = preferenceService.getGenrePreferenceScore(currentUser.getId(), genre);
        return ResponseEntity.ok(new PreferenceCheckResponse(genre, hasPreference, score));
    }

    /**
     * Get current user's preference statistics
     */
    @GetMapping("/my-stats")
    public ResponseEntity<UserGenrePreferenceService.UserPreferenceStats> getMyPreferenceStats() {
        User currentUser = userService.getCurrentUser();
        UserGenrePreferenceService.UserPreferenceStats stats =
                preferenceService.getUserPreferenceStats(currentUser.getId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Find users with similar preferences (Admin only)
     */
    @GetMapping("/similar-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserGenrePreferenceService.SimilarUser>> findSimilarUsers(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "3") int minCommonGenres) {
        List<UserGenrePreferenceService.SimilarUser> similarUsers =
                preferenceService.findUsersWithSimilarPreferences(userId, minCommonGenres);
        return ResponseEntity.ok(similarUsers);
    }

    /**
     * Get genre popularity statistics (Admin only)
     */
    @GetMapping("/popularity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserGenrePreferenceService.GenrePopularity>> getGenrePopularity(
            @RequestParam(defaultValue = "3") int minScore) {
        List<UserGenrePreferenceService.GenrePopularity> popularity =
                preferenceService.getGenrePopularity(minScore);
        return ResponseEntity.ok(popularity);
    }

    /**
     * Learn from user behavior (internal API for system use)
     */
    @PostMapping("/learn")
    public ResponseEntity<Void> learnFromBehavior(@Valid @RequestBody LearnBehaviorRequest request) {
        User currentUser = userService.getCurrentUser();
        preferenceService.learnFromUserBehavior(currentUser.getId(), request.movieGenre(), request.action());
        return ResponseEntity.ok().build();
    }

    // DTOs
    public record SetPreferenceRequest(String genre, Integer score) {}

    public record SetMultiplePreferencesRequest(Map<String, Integer> genreScores) {}

    public record InitializePreferencesRequest(List<String> preferredGenres) {}

    public record UpdatePreferenceRequest(Integer score) {}

    public record PreferenceCheckResponse(String genre, boolean hasPreference, Integer score) {}

    public record LearnBehaviorRequest(String movieGenre, UserGenrePreferenceService.UserAction action) {}
}