package com.example.cinema.repository;

import com.example.cinema.entity.FavoriteMovie;
import com.example.cinema.entity.Movie;
import com.example.cinema.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * FavoriteMovie Repository - Database operations for favorite movies
 */
@Repository
public interface FavoriteMovieRepository extends JpaRepository<FavoriteMovie, Long> {

    /**
     * Find favorite movie by user and movie
     */
    Optional<FavoriteMovie> findByUserAndMovie(User user, Movie movie);

    /**
     * Find user's favorite movies with pagination
     */
    Page<FavoriteMovie> findByUserOrderByAddedAtDesc(User user, Pageable pageable);

    /**
     * Find user's favorite movies by user ID
     */
    @Query("SELECT fm FROM FavoriteMovie fm JOIN FETCH fm.movie WHERE fm.user.id = :userId ORDER BY fm.addedAt DESC")
    List<FavoriteMovie> findByUserIdWithMovie(@Param("userId") Long userId);

    /**
     * Find user's favorite movies with pagination and movie details
     */
    @Query("SELECT fm FROM FavoriteMovie fm JOIN FETCH fm.movie WHERE fm.user.id = :userId ORDER BY fm.addedAt DESC")
    Page<FavoriteMovie> findByUserIdWithMoviePage(@Param("userId") Long userId, Pageable pageable);

    /**
     * Check if user has movie in favorites
     */
    boolean existsByUserAndMovie(User user, Movie movie);

    /**
     * Check if user has movie in favorites by IDs
     */
    @Query("SELECT COUNT(fm) > 0 FROM FavoriteMovie fm WHERE fm.user.id = :userId AND fm.movie.id = :movieId")
    boolean existsByUserIdAndMovieId(@Param("userId") Long userId, @Param("movieId") Long movieId);

    /**
     * Count user's favorite movies
     */
    long countByUser(User user);

    /**
     * Count user's favorite movies by ID
     */
    @Query("SELECT COUNT(fm) FROM FavoriteMovie fm WHERE fm.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    /**
     * Find user's favorite movies by genre
     */
    @Query("SELECT fm FROM FavoriteMovie fm JOIN FETCH fm.movie m WHERE fm.user.id = :userId AND LOWER(m.genre) LIKE LOWER(CONCAT('%', :genre, '%')) ORDER BY fm.addedAt DESC")
    List<FavoriteMovie> findByUserIdAndGenre(@Param("userId") Long userId, @Param("genre") String genre);

    /**
     * Find user's recently added favorites (last 7 days)
     */
    @Query("SELECT fm FROM FavoriteMovie fm JOIN FETCH fm.movie WHERE fm.user.id = :userId AND fm.addedAt >= :since ORDER BY fm.addedAt DESC")
    List<FavoriteMovie> findRecentFavorites(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Get user's favorite genres (most frequent)
     */
    @Query("""
        SELECT m.genre, COUNT(fm) as count FROM FavoriteMovie fm
        JOIN fm.movie m
        WHERE fm.user.id = :userId
        GROUP BY m.genre
        ORDER BY count DESC
    """)
    List<Object[]> getUserFavoriteGenres(@Param("userId") Long userId);

    /**
     * Find movies favorited by multiple users (popular favorites)
     */
    @Query("""
        SELECT m, COUNT(fm) as favoriteCount FROM FavoriteMovie fm
        JOIN fm.movie m
        GROUP BY m.id
        HAVING COUNT(fm) >= :minCount
        ORDER BY favoriteCount DESC
    """)
    List<Object[]> findPopularFavoriteMovies(@Param("minCount") int minCount, Pageable pageable);

    /**
     * Delete favorite movie by user and movie
     */
    void deleteByUserAndMovie(User user, Movie movie);

    /**
     * Delete user's favorite by IDs
     */
    @Query("DELETE FROM FavoriteMovie fm WHERE fm.user.id = :userId AND fm.movie.id = :movieId")
    void deleteByUserIdAndMovieId(@Param("userId") Long userId, @Param("movieId") Long movieId);

    /**
     * Find users who favorited a specific movie
     */
    @Query("SELECT fm FROM FavoriteMovie fm JOIN FETCH fm.user WHERE fm.movie.id = :movieId ORDER BY fm.addedAt DESC")
    List<FavoriteMovie> findUsersWhoFavoritedMovie(@Param("movieId") Long movieId);

    /**
     * Get favorite movies statistics for admin - Total users with favorites
     */
    @Query("SELECT COUNT(DISTINCT fm.user.id) FROM FavoriteMovie fm")
    Long getTotalUsersWithFavorites();

    /**
     * Get favorite movies statistics for admin - Total favorites count
     */
    @Query("SELECT COUNT(fm) FROM FavoriteMovie fm")
    Long getTotalFavoritesCount();

    /**
     * Get favorite movies statistics for admin - User favorite counts for average calculation
     */
    @Query("SELECT COUNT(fm) FROM FavoriteMovie fm GROUP BY fm.user.id")
    List<Long> getUserFavoriteCounts();
}