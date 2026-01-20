package com.example.cinema.service;

import com.example.cinema.entity.Movie;
import com.example.cinema.entity.Review;
import com.example.cinema.entity.User;
import com.example.cinema.repository.MovieRepository;
import com.example.cinema.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Review Service - Business Logic for Review Management
 * Handles all review-related business operations
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;

    /**
     * Get all reviews with pagination (Admin only)
     */
    public Page<Review> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }

    /**
     * Get review by ID
     */
    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    /**
     * Get reviews for a specific movie
     */
    public Page<Review> getReviewsForMovie(Long movieId, Pageable pageable) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId, pageable);
    }

    /**
     * Get user's reviews
     */
    public Page<Review> getUserReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get reviews by rating
     */
    public Page<Review> getReviewsByRating(Integer rating, Pageable pageable) {
        return reviewRepository.findByRatingOrderByCreatedAtDesc(rating, pageable);
    }

    /**
     * Get reviews by rating range
     */
    public Page<Review> getReviewsByRatingRange(Integer minRating, Integer maxRating, Pageable pageable) {
        return reviewRepository.findByRatingRange(minRating, maxRating, pageable);
    }

    /**
     * Get reviews with text content
     */
    public Page<Review> getReviewsWithText(Pageable pageable) {
        return reviewRepository.findReviewsWithText(pageable);
    }

    /**
     * Get recent reviews
     */
    public Page<Review> getRecentReviews(Pageable pageable) {
        return reviewRepository.findByOrderByCreatedAtDesc(pageable);
    }

    /**
     * Create new review with business validation
     */
    public ReviewResult createReview(User user, Long movieId, Integer rating, String reviewText) {
        // Check if movie exists
        Optional<Movie> movieOpt = movieRepository.findById(movieId);
        if (movieOpt.isEmpty()) {
            return ReviewResult.error("Movie not found");
        }

        // Check if user already reviewed this movie
        if (reviewRepository.existsByMovieIdAndUserId(movieId, user.getId())) {
            return ReviewResult.error("You have already reviewed this movie");
        }

        // Validate rating
        if (rating == null || rating < 1 || rating > 5) {
            return ReviewResult.error("Rating must be between 1 and 5");
        }

        Review review = Review.builder()
                .movie(movieOpt.get())
                .user(user)
                .rating(rating)
                .reviewText(reviewText)
                .build();

        Review savedReview = reviewRepository.save(review);
        return ReviewResult.success(savedReview);
    }

    /**
     * Update review with business validation
     */
    public ReviewResult updateReview(Long reviewId, User requestingUser, Integer rating, String reviewText) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);

        if (reviewOpt.isEmpty()) {
            return ReviewResult.error("Review not found");
        }

        Review review = reviewOpt.get();

        // Authorization check: users can only update their own reviews
        if (!requestingUser.isAdmin() && !review.getUser().getId().equals(requestingUser.getId())) {
            return ReviewResult.error("Not authorized to update this review");
        }

        // Validate rating if provided
        if (rating != null && (rating < 1 || rating > 5)) {
            return ReviewResult.error("Rating must be between 1 and 5");
        }

        // Update fields
        if (rating != null) {
            review.setRating(rating);
        }
        if (reviewText != null) {
            review.setReviewText(reviewText);
        }

        Review updatedReview = reviewRepository.save(review);
        return ReviewResult.success(updatedReview);
    }

    /**
     * Delete review with authorization check
     */
    public ReviewResult deleteReview(Long reviewId, User requestingUser) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);

        if (reviewOpt.isEmpty()) {
            return ReviewResult.error("Review not found");
        }

        Review review = reviewOpt.get();

        // Authorization check: users can only delete their own reviews
        if (!requestingUser.isAdmin() && !review.getUser().getId().equals(requestingUser.getId())) {
            return ReviewResult.error("Not authorized to delete this review");
        }

        reviewRepository.delete(review);
        return ReviewResult.success(null);
    }

    /**
     * Get movie rating statistics
     */
    public Optional<MovieRatingStats> getMovieRatingStats(Long movieId) {
        if (!movieRepository.existsById(movieId)) {
            return Optional.empty();
        }

        Optional<Double> averageRating = reviewRepository.getAverageRatingForMovie(movieId);
        long reviewCount = reviewRepository.countByMovieId(movieId);
        List<Object[]> distribution = reviewRepository.getRatingDistribution(movieId);

        RatingDistribution ratingDist = new RatingDistribution(
            distribution.stream().filter(row -> row[0].equals(1)).mapToLong(row -> (Long) row[1]).sum(),
            distribution.stream().filter(row -> row[0].equals(2)).mapToLong(row -> (Long) row[1]).sum(),
            distribution.stream().filter(row -> row[0].equals(3)).mapToLong(row -> (Long) row[1]).sum(),
            distribution.stream().filter(row -> row[0].equals(4)).mapToLong(row -> (Long) row[1]).sum(),
            distribution.stream().filter(row -> row[0].equals(5)).mapToLong(row -> (Long) row[1]).sum()
        );

        MovieRatingStats stats = new MovieRatingStats(
            movieId,
            averageRating.orElse(0.0),
            reviewCount,
            ratingDist
        );

        return Optional.of(stats);
    }

    /**
     * Get top-rated movies
     */
    public List<TopRatedMovie> getTopRatedMovies(Long minReviews, int limit, Pageable pageable) {
        List<Object[]> results = reviewRepository.findTopRatedMovies(minReviews, pageable);

        return results.stream()
                .map(row -> new TopRatedMovie(
                    (Long) row[0],      // movieId
                    (String) row[1],    // title
                    ((Number) row[2]).doubleValue(), // avgRating
                    (Long) row[3]       // reviewCount
                ))
                .toList();
    }

    /**
     * Get overall review statistics
     */
    public ReviewStats getReviewStats() {
        long totalReviews = reviewRepository.count();
        Optional<Double> overallAverage = reviewRepository.getOverallAverageRating();

        // Get rating distribution
        long rating1 = reviewRepository.countByRating(1);
        long rating2 = reviewRepository.countByRating(2);
        long rating3 = reviewRepository.countByRating(3);
        long rating4 = reviewRepository.countByRating(4);
        long rating5 = reviewRepository.countByRating(5);

        RatingDistribution distribution = new RatingDistribution(rating1, rating2, rating3, rating4, rating5);

        return new ReviewStats(
            totalReviews,
            overallAverage.orElse(0.0),
            distribution
        );
    }

    /**
     * Check if user owns review
     */
    public boolean userOwnsReview(Long reviewId, Long userId) {
        return reviewRepository.findById(reviewId)
                .map(review -> review.getUser().getId().equals(userId))
                .orElse(false);
    }

    /**
     * Review Result wrapper for error handling
     */
    public static class ReviewResult {
        private final Review review;
        private final String error;
        private final boolean success;

        private ReviewResult(Review review, String error, boolean success) {
            this.review = review;
            this.error = error;
            this.success = success;
        }

        public static ReviewResult success(Review review) {
            return new ReviewResult(review, null, true);
        }

        public static ReviewResult error(String error) {
            return new ReviewResult(null, error, false);
        }

        public boolean isSuccess() { return success; }
        public Review getReview() { return review; }
        public String getError() { return error; }
    }

    /**
     * Rating Distribution DTO
     */
    public record RatingDistribution(
        long rating1,
        long rating2,
        long rating3,
        long rating4,
        long rating5
    ) {}

    /**
     * Movie Rating Statistics DTO
     */
    public record MovieRatingStats(
        Long movieId,
        Double averageRating,
        Long reviewCount,
        RatingDistribution distribution
    ) {}

    /**
     * Top Rated Movie DTO
     */
    public record TopRatedMovie(
        Long movieId,
        String title,
        Double averageRating,
        Long reviewCount
    ) {}

    /**
     * Overall Review Statistics DTO
     */
    public record ReviewStats(
        long totalReviews,
        Double overallAverage,
        RatingDistribution distribution
    ) {}
}