package com.example.cinema.service;

import com.example.cinema.entity.User;
import com.example.cinema.entity.UserGenrePreference;
import com.example.cinema.exception.BusinessRuleViolationException;
import com.example.cinema.exception.ResourceNotFoundException;
import com.example.cinema.exception.ValidationException;
import com.example.cinema.repository.UserGenrePreferenceRepository;
import com.example.cinema.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * UserGenrePreference Service - Business Logic for User Genre Preferences Management
 * Handles user's movie genre preferences and recommendations
 */
@Service
@RequiredArgsConstructor
public class UserGenrePreferenceService {

    private final UserGenrePreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final MovieService movieService;

    /**
     * Set user's genre preference
     */
    @Transactional
    public UserGenrePreference setGenrePreference(Long userId, String genre, Integer preferenceScore) {
        // Validate input
        if (genre == null || genre.trim().isEmpty()) {
            throw new ValidationException("Genre cannot be empty");
        }

        if (preferenceScore == null || preferenceScore < 1 || preferenceScore > 5) {
            throw new ValidationException("Preference score must be between 1 and 5");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Validate genre exists in system
        List<String> availableGenres = movieService.getAllGenres();
        boolean genreExists = availableGenres.stream()
                .anyMatch(g -> g.equalsIgnoreCase(genre.trim()));

        if (!genreExists) {
            throw new ValidationException("Genre '" + genre + "' is not available in the system");
        }

        // Find existing preference or create new
        UserGenrePreference preference = preferenceRepository.findByUserAndGenreIgnoreCase(user, genre.trim())
                .orElse(UserGenrePreference.builder()
                        .user(user)
                        .genre(genre.trim())
                        .build());

        preference.setPreferenceScore(preferenceScore);
        preference.setUpdatedAt(LocalDateTime.now());

        return preferenceRepository.save(preference);
    }

    /**
     * Get user's genre preferences
     */
    public List<UserGenrePreference> getUserGenrePreferences(Long userId) {
        return preferenceRepository.findByUserIdOrderByPreferenceDesc(userId);
    }

    /**
     * Get user's high preference genres (score >= 4)
     */
    public List<UserGenrePreference> getHighPreferenceGenres(Long userId) {
        return preferenceRepository.findHighPreferenceGenres(userId);
    }

    /**
     * Get user's preferred genre names
     */
    public List<String> getPreferredGenreNames(Long userId, Integer minScore) {
        if (minScore == null) minScore = 4;
        return preferenceRepository.findPreferredGenreNames(userId, minScore);
    }

    /**
     * Get user's top N preferred genres
     */
    public List<String> getTopPreferredGenres(Long userId, int limit) {
        return preferenceRepository.findTopPreferredGenres(userId, limit);
    }

    /**
     * Set multiple genre preferences at once
     */
    @Transactional
    public List<UserGenrePreference> setMultipleGenrePreferences(Long userId, Map<String, Integer> genreScores) {
        return genreScores.entrySet().stream()
                .map(entry -> setGenrePreference(userId, entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    /**
     * Initialize user preferences based on available genres
     */
    @Transactional
    public List<UserGenrePreference> initializeUserPreferences(Long userId, List<String> preferredGenres) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<String> availableGenres = movieService.getAllGenres();

        return preferredGenres.stream()
                .filter(genre -> availableGenres.stream().anyMatch(g -> g.equalsIgnoreCase(genre)))
                .map(genre -> {
                    UserGenrePreference preference = UserGenrePreference.builder()
                            .user(user)
                            .genre(genre)
                            .preferenceScore(4) // Default high preference for selected genres
                            .build();
                    return preferenceRepository.save(preference);
                })
                .collect(Collectors.toList());
    }

    /**
     * Update preference score for specific genre
     */
    @Transactional
    public UserGenrePreference updatePreferenceScore(Long userId, String genre, Integer newScore) {
        return setGenrePreference(userId, genre, newScore);
    }

    /**
     * Increment preference score for genre (when user likes a movie of this genre)
     */
    @Transactional
    public UserGenrePreference incrementGenrePreference(Long userId, String genre) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserGenrePreference preference = preferenceRepository.findByUserAndGenreIgnoreCase(user, genre)
                .orElse(UserGenrePreference.builder()
                        .user(user)
                        .genre(genre)
                        .preferenceScore(3)
                        .build());

        preference.incrementPreference();
        return preferenceRepository.save(preference);
    }

    /**
     * Decrement preference score for genre (when user dislikes a movie of this genre)
     */
    @Transactional
    public UserGenrePreference decrementGenrePreference(Long userId, String genre) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserGenrePreference preference = preferenceRepository.findByUserAndGenreIgnoreCase(user, genre)
                .orElse(UserGenrePreference.builder()
                        .user(user)
                        .genre(genre)
                        .preferenceScore(3)
                        .build());

        preference.decrementPreference();
        return preferenceRepository.save(preference);
    }

    /**
     * Remove genre preference
     */
    @Transactional
    public void removeGenrePreference(Long userId, String genre) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        preferenceRepository.deleteByUserAndGenreIgnoreCase(user, genre);
    }

    /**
     * Check if user has preference for genre
     */
    public boolean hasGenrePreference(Long userId, String genre) {
        return preferenceRepository.existsByUserIdAndGenre(userId, genre);
    }

    /**
     * Get user's preference score for specific genre
     */
    public Integer getGenrePreferenceScore(Long userId, String genre) {
        return preferenceRepository.findByUserIdAndGenre(userId, genre)
                .map(UserGenrePreference::getPreferenceScore)
                .orElse(null);
    }

    /**
     * Get average preference score for user
     */
    public Double getAveragePreferenceScore(Long userId) {
        return preferenceRepository.getAveragePreferenceScore(userId);
    }

    /**
     * Find users with similar genre preferences
     */
    public List<SimilarUser> findUsersWithSimilarPreferences(Long userId, int minCommonGenres) {
        List<Object[]> results = preferenceRepository.findUsersWithSimilarPreferences(userId, minCommonGenres);
        return results.stream()
                .map(row -> new SimilarUser(((Number) row[0]).longValue(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    /**
     * Get genre popularity statistics
     */
    public List<GenrePopularity> getGenrePopularity(int minScore) {
        List<Object[]> results = preferenceRepository.getGenrePopularity(minScore);
        return results.stream()
                .map(row -> new GenrePopularity(
                        (String) row[0],
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).doubleValue()))
                .collect(Collectors.toList());
    }

    /**
     * Get user's preference statistics
     */
    public UserPreferenceStats getUserPreferenceStats(Long userId) {
        List<UserGenrePreference> preferences = getUserGenrePreferences(userId);
        long totalPreferences = preferences.size();
        long highPreferences = preferenceRepository.countHighPreferences(userId);
        Double averageScore = preferenceRepository.getAveragePreferenceScore(userId);

        List<UserGenrePreference> recentlyUpdated = preferenceRepository.findRecentlyUpdated(
                userId, LocalDateTime.now().minusDays(30));

        return new UserPreferenceStats(
                totalPreferences,
                highPreferences,
                averageScore != null ? averageScore : 0.0,
                recentlyUpdated.size()
        );
    }

    /**
     * Smart preference learning from user behavior
     */
    @Transactional
    public void learnFromUserBehavior(Long userId, String movieGenre, UserAction action) {
        switch (action) {
            case FAVORITE_MOVIE -> incrementGenrePreference(userId, movieGenre);
            case UNFAVORITE_MOVIE -> decrementGenrePreference(userId, movieGenre);
            case BOOK_MOVIE -> {
                // Slight increment for booking (user showed interest)
                UserGenrePreference preference = preferenceRepository.findByUserIdAndGenre(userId, movieGenre)
                        .orElse(null);
                if (preference == null || preference.getPreferenceScore() < 4) {
                    incrementGenrePreference(userId, movieGenre);
                }
            }
        }
    }

    // DTOs and Enums
    public record SimilarUser(Long userId, Long commonGenres) {}

    public record GenrePopularity(String genre, Long userCount, Double averageScore) {}

    public record UserPreferenceStats(
            Long totalPreferences,
            Long highPreferences,
            Double averageScore,
            Integer recentlyUpdated
    ) {}

    public enum UserAction {
        FAVORITE_MOVIE,
        UNFAVORITE_MOVIE,
        BOOK_MOVIE,
        RATE_MOVIE_HIGH,
        RATE_MOVIE_LOW
    }

    /**
     * Batch preference update request
     */
    public record PreferenceUpdateRequest(String genre, Integer score) {}
}