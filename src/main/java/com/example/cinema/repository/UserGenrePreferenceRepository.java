package com.example.cinema.repository;

import com.example.cinema.entity.UserGenrePreference;
import com.example.cinema.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * UserGenrePreference Repository - Database operations for user genre preferences
 */
@Repository
public interface UserGenrePreferenceRepository extends JpaRepository<UserGenrePreference, Long> {

    /**
     * Find user's genre preference
     */
    Optional<UserGenrePreference> findByUserAndGenreIgnoreCase(User user, String genre);

    /**
     * Find user's genre preference by IDs
     */
    @Query("SELECT ugp FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND LOWER(ugp.genre) = LOWER(:genre)")
    Optional<UserGenrePreference> findByUserIdAndGenre(@Param("userId") Long userId, @Param("genre") String genre);

    /**
     * Find all user's genre preferences ordered by score
     */
    List<UserGenrePreference> findByUserOrderByPreferenceScoreDescGenreAsc(User user);

    /**
     * Find user's genre preferences by user ID
     */
    @Query("SELECT ugp FROM UserGenrePreference ugp WHERE ugp.user.id = :userId ORDER BY ugp.preferenceScore DESC, ugp.genre ASC")
    List<UserGenrePreference> findByUserIdOrderByPreferenceDesc(@Param("userId") Long userId);

    /**
     * Find user's high preference genres (score >= 4)
     */
    @Query("SELECT ugp FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND ugp.preferenceScore >= 4 ORDER BY ugp.preferenceScore DESC")
    List<UserGenrePreference> findHighPreferenceGenres(@Param("userId") Long userId);

    /**
     * Find user's preferred genres as list of strings
     */
    @Query("SELECT ugp.genre FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND ugp.preferenceScore >= :minScore ORDER BY ugp.preferenceScore DESC")
    List<String> findPreferredGenreNames(@Param("userId") Long userId, @Param("minScore") Integer minScore);

    /**
     * Find user's top N preferred genres
     */
    @Query(value = "SELECT ugp.genre FROM UserGenrePreference ugp WHERE ugp.user.id = :userId ORDER BY ugp.preferenceScore DESC LIMIT :limit", nativeQuery = true)
    List<String> findTopPreferredGenres(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * Check if user has genre preference
     */
    boolean existsByUserAndGenreIgnoreCase(User user, String genre);

    /**
     * Check if user has genre preference by IDs
     */
    @Query("SELECT COUNT(ugp) > 0 FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND LOWER(ugp.genre) = LOWER(:genre)")
    boolean existsByUserIdAndGenre(@Param("userId") Long userId, @Param("genre") String genre);

    /**
     * Count user's genre preferences
     */
    long countByUser(User user);

    /**
     * Count user's high preference genres
     */
    @Query("SELECT COUNT(ugp) FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND ugp.preferenceScore >= 4")
    long countHighPreferences(@Param("userId") Long userId);

    /**
     * Find recently updated preferences
     */
    @Query("SELECT ugp FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND ugp.updatedAt >= :since ORDER BY ugp.updatedAt DESC")
    List<UserGenrePreference> findRecentlyUpdated(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Get average preference score for user
     */
    @Query("SELECT AVG(ugp.preferenceScore) FROM UserGenrePreference ugp WHERE ugp.user.id = :userId")
    Double getAveragePreferenceScore(@Param("userId") Long userId);

    /**
     * Find users with similar genre preferences
     */
    @Query("""
        SELECT ugp2.user.id, COUNT(ugp2) as commonGenres
        FROM UserGenrePreference ugp1
        JOIN UserGenrePreference ugp2 ON LOWER(ugp1.genre) = LOWER(ugp2.genre)
        WHERE ugp1.user.id = :userId
        AND ugp2.user.id != :userId
        AND ugp1.preferenceScore >= 4
        AND ugp2.preferenceScore >= 4
        GROUP BY ugp2.user.id
        HAVING COUNT(ugp2) >= :minCommonGenres
        ORDER BY commonGenres DESC
    """)
    List<Object[]> findUsersWithSimilarPreferences(@Param("userId") Long userId, @Param("minCommonGenres") int minCommonGenres);

    /**
     * Get genre popularity (how many users prefer each genre)
     */
    @Query("""
        SELECT ugp.genre, COUNT(ugp) as userCount, AVG(ugp.preferenceScore) as avgScore
        FROM UserGenrePreference ugp
        WHERE ugp.preferenceScore >= :minScore
        GROUP BY ugp.genre
        ORDER BY userCount DESC, avgScore DESC
    """)
    List<Object[]> getGenrePopularity(@Param("minScore") int minScore);

    /**
     * Delete user's genre preference
     */
    void deleteByUserAndGenreIgnoreCase(User user, String genre);

    /**
     * Delete user's genre preference by IDs
     */
    @Query("DELETE FROM UserGenrePreference ugp WHERE ugp.user.id = :userId AND LOWER(ugp.genre) = LOWER(:genre)")
    void deleteByUserIdAndGenre(@Param("userId") Long userId, @Param("genre") String genre);

    /**
     * Update preference score
     */
    @Query("UPDATE UserGenrePreference ugp SET ugp.preferenceScore = :score, ugp.updatedAt = CURRENT_TIMESTAMP WHERE ugp.user.id = :userId AND LOWER(ugp.genre) = LOWER(:genre)")
    void updatePreferenceScore(@Param("userId") Long userId, @Param("genre") String genre, @Param("score") Integer score);
}