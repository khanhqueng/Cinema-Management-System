package com.example.cinema.controller;

import com.example.cinema.entity.Movie;
import com.example.cinema.entity.Review;
import com.example.cinema.entity.User;
import com.example.cinema.repository.MovieRepository;
import com.example.cinema.repository.ReviewRepository;
import com.example.cinema.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Review Controller - CRUD Operations for Movie Reviews
 * Provides comprehensive review management with proper authorization
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    /**
     * Get all reviews (Admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Review>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Review> reviews = reviewRepository.findAll(pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Get review by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable Long id) {
        Optional<Review> review = reviewRepository.findById(id);
        return review.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get reviews for a specific movie
     */
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<Page<Review>> getReviewsForMovie(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId, pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Get my reviews (user's own reviews)
     */
    @GetMapping("/my-reviews")
    public ResponseEntity<Page<Review>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Get reviews by rating
     */
    @GetMapping("/rating/{rating}")
    public ResponseEntity<Page<Review>> getReviewsByRating(
            @PathVariable Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByRatingOrderByCreatedAtDesc(rating, pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Get reviews by rating range
     */
    @GetMapping("/rating-range")
    public ResponseEntity<Page<Review>> getReviewsByRatingRange(
            @RequestParam Integer minRating,
            @RequestParam Integer maxRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (minRating < 1 || maxRating > 5 || minRating > maxRating) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByRatingRange(minRating, maxRating, pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Get reviews with text content
     */
    @GetMapping("/with-text")
    public ResponseEntity<Page<Review>> getReviewsWithText(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findReviewsWithText(pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Get recent reviews
     */
    @GetMapping("/recent")
    public ResponseEntity<Page<Review>> getRecentReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByOrderByCreatedAtDesc(pageable);

        return ResponseEntity.ok(reviews);
    }

    /**
     * Create new review
     */
    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody CreateReviewRequest request) {
        User currentUser = getCurrentUser();

        // Check if movie exists
        Optional<Movie> movieOpt = movieRepository.findById(request.movieId());
        if (movieOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Movie not found");
        }

        // Check if user already reviewed this movie
        if (reviewRepository.existsByMovieIdAndUserId(request.movieId(), currentUser.getId())) {
            return ResponseEntity.badRequest().body("You have already reviewed this movie");
        }

        // Validate rating
        if (request.rating() < 1 || request.rating() > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        Review review = Review.builder()
                .movie(movieOpt.get())
                .user(currentUser)
                .rating(request.rating())
                .reviewText(request.reviewText())
                .build();

        Review savedReview = reviewRepository.save(review);
        return ResponseEntity.ok(savedReview);
    }

    /**
     * Update review (user can update their own review)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReview(@PathVariable Long id, @Valid @RequestBody UpdateReviewRequest request) {
        Optional<Review> reviewOpt = reviewRepository.findById(id);

        if (reviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Review review = reviewOpt.get();
        User currentUser = getCurrentUser();

        // Users can only update their own reviews, admins can update any
        if (!currentUser.isAdmin() && !review.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }

        // Validate rating if provided
        if (request.rating() != null && (request.rating() < 1 || request.rating() > 5)) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        // Update fields
        if (request.rating() != null) {
            review.setRating(request.rating());
        }
        if (request.reviewText() != null) {
            review.setReviewText(request.reviewText());
        }

        Review updatedReview = reviewRepository.save(review);
        return ResponseEntity.ok(updatedReview);
    }

    /**
     * Delete review (user can delete their own, admin can delete any)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        Optional<Review> reviewOpt = reviewRepository.findById(id);

        if (reviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Review review = reviewOpt.get();
        User currentUser = getCurrentUser();

        // Users can only delete their own reviews, admins can delete any
        if (!currentUser.isAdmin() && !review.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }

        reviewRepository.delete(review);
        return ResponseEntity.ok().build();
    }

    /**
     * Get movie rating statistics
     */
    @GetMapping("/movie/{movieId}/stats")
    public ResponseEntity<MovieRatingStats> getMovieRatingStats(@PathVariable Long movieId) {
        if (!movieRepository.existsById(movieId)) {
            return ResponseEntity.notFound().build();
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

        return ResponseEntity.ok(stats);
    }

    /**
     * Get top-rated movies
     */
    @GetMapping("/top-rated-movies")
    public ResponseEntity<List<TopRatedMovie>> getTopRatedMovies(
            @RequestParam(defaultValue = "3") Long minReviews,
            @RequestParam(defaultValue = "10") int limit) {

        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> results = reviewRepository.findTopRatedMovies(minReviews, pageable);

        List<TopRatedMovie> topRatedMovies = results.stream()
                .map(row -> new TopRatedMovie(
                    (Long) row[0],      // movieId
                    (String) row[1],    // title
                    ((Number) row[2]).doubleValue(), // avgRating
                    (Long) row[3]       // reviewCount
                ))
                .toList();

        return ResponseEntity.ok(topRatedMovies);
    }

    /**
     * Get overall review statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewStats> getReviewStats() {
        long totalReviews = reviewRepository.count();
        Optional<Double> overallAverage = reviewRepository.getOverallAverageRating();

        // Get rating distribution
        long rating1 = reviewRepository.countByRating(1);
        long rating2 = reviewRepository.countByRating(2);
        long rating3 = reviewRepository.countByRating(3);
        long rating4 = reviewRepository.countByRating(4);
        long rating5 = reviewRepository.countByRating(5);

        RatingDistribution distribution = new RatingDistribution(rating1, rating2, rating3, rating4, rating5);

        ReviewStats stats = new ReviewStats(
            totalReviews,
            overallAverage.orElse(0.0),
            distribution
        );

        return ResponseEntity.ok(stats);
    }

    /**
     * Get current user from security context
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Create Review Request DTO
     */
    public record CreateReviewRequest(
        Long movieId,
        Integer rating,
        String reviewText
    ) {}

    /**
     * Update Review Request DTO
     */
    public record UpdateReviewRequest(
        Integer rating,
        String reviewText
    ) {}

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