package com.example.cinema.repository;

import com.example.cinema.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Review Repository - User Feedback System
 * Simple review operations with rating calculations
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Find reviews for a movie
    Page<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId, Pageable pageable);

    // Find user's reviews
    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Find specific user's review for a movie
    Optional<Review> findByMovieIdAndUserId(Long movieId, Long userId);

    // Check if user already reviewed a movie
    boolean existsByMovieIdAndUserId(Long movieId, Long userId);

    // Find reviews by rating
    Page<Review> findByRatingOrderByCreatedAtDesc(Integer rating, Pageable pageable);

    // Find reviews by rating range
    @Query("SELECT r FROM Review r WHERE r.rating BETWEEN :minRating AND :maxRating ORDER BY r.createdAt DESC")
    Page<Review> findByRatingRange(@Param("minRating") Integer minRating,
                                  @Param("maxRating") Integer maxRating,
                                  Pageable pageable);

    // Get average rating for a movie
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.movie.id = :movieId")
    Optional<Double> getAverageRatingForMovie(@Param("movieId") Long movieId);

    // Get rating distribution for a movie
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.movie.id = :movieId GROUP BY r.rating ORDER BY r.rating")
    List<Object[]> getRatingDistribution(@Param("movieId") Long movieId);

    // Find reviews with text (not just ratings)
    @Query("SELECT r FROM Review r WHERE r.reviewText IS NOT NULL AND LENGTH(TRIM(r.reviewText)) > 0 ORDER BY r.createdAt DESC")
    Page<Review> findReviewsWithText(Pageable pageable);

    // Find recent reviews
    Page<Review> findByOrderByCreatedAtDesc(Pageable pageable);

    // Top-rated movies
    @Query("SELECT r.movie.id, r.movie.title, AVG(r.rating) as avgRating, COUNT(r) as reviewCount " +
           "FROM Review r " +
           "GROUP BY r.movie.id, r.movie.title " +
           "HAVING COUNT(r) >= :minReviews " +
           "ORDER BY AVG(r.rating) DESC, COUNT(r) DESC")
    List<Object[]> findTopRatedMovies(@Param("minReviews") Long minReviews, Pageable pageable);

    // Statistics
    @Query("SELECT COUNT(r) FROM Review r WHERE r.movie.id = :movieId")
    long countByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.rating = :rating")
    long countByRating(@Param("rating") Integer rating);

    @Query("SELECT AVG(r.rating) FROM Review r")
    Optional<Double> getOverallAverageRating();
}