package com.example.cinema.repository;

import com.example.cinema.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Movie Repository - Content Management
 * Essential movie CRUD operations with search capabilities
 */
@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    // Search by title
    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Filter by genre
    Page<Movie> findByGenreIgnoreCase(String genre, Pageable pageable);

    // Currently showing movies
    @Query("SELECT m FROM Movie m WHERE m.releaseDate <= :currentDate ORDER BY m.releaseDate DESC")
    Page<Movie> findCurrentlyShowing(@Param("currentDate") LocalDate currentDate, Pageable pageable);

    // AI Vector Similarity Search - Find similar movies using embeddings
    @Query(value = """
        SELECT m.id, m.title, m.director, m.genre, m.description,
               m.duration_minutes, m.release_date, m.poster_url, m.price_base, m.created_at, m.updated_at,
               (m.embedding <=> CAST(:userEmbedding AS vector)) as distance
        FROM movies m
        WHERE m.embedding IS NOT NULL
        ORDER BY m.embedding <=> CAST(:userEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findSimilarMoviesByEmbeddingRaw(
            @Param("userEmbedding") String userEmbedding,
            @Param("limit") int limit
    );

    // Get movie IDs that have embeddings
    @Query(value = "SELECT id FROM movies WHERE embedding IS NOT NULL ORDER BY id", nativeQuery = true)
    List<Long> findMovieIdsWithEmbeddings();

    // Note: getMovieEmbeddingAsText() method no longer needed since embedding is now String type

    // Find movies that need embeddings (for batch processing)
    @Query(value = "SELECT * FROM movies WHERE embedding IS NULL", nativeQuery = true)
    List<Movie> findMoviesWithoutEmbeddings();

    // Note: findMoviesWithEmbeddings() method removed due to Hibernate vector mapping issues
    // Use findMovieIdsWithEmbeddings() + findAllById() + getMovieEmbeddingAsText() instead

    // Upcoming movies
    @Query("SELECT m FROM Movie m WHERE m.releaseDate > :currentDate ORDER BY m.releaseDate ASC")
    Page<Movie> findUpcoming(@Param("currentDate") LocalDate currentDate, Pageable pageable);

    // Search functionality
    @Query("SELECT m FROM Movie m WHERE " +
           "LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.director) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.genre) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Movie> searchMovies(@Param("search") String search, Pageable pageable);

    // Movies with active showtimes
    @Query("SELECT DISTINCT m FROM Movie m " +
           "JOIN m.showtimes s " +
           "WHERE s.showDatetime > CURRENT_TIMESTAMP")
    Page<Movie> findMoviesWithActiveShowtimes(Pageable pageable);

    // Popular movies by booking count
    @Query("SELECT m FROM Movie m " +
           "LEFT JOIN m.showtimes s " +
           "LEFT JOIN s.bookings b " +
           "WHERE b.bookingStatus = 'CONFIRMED' " +
           "GROUP BY m " +
           "ORDER BY COUNT(b) DESC")
    Page<Movie> findPopularMovies(Pageable pageable);

    // Get distinct genres
    @Query("SELECT DISTINCT m.genre FROM Movie m WHERE m.genre IS NOT NULL ORDER BY m.genre")
    List<String> findAllGenres();

    // Fetch movie with reviews for rating calculations
    @Query("SELECT DISTINCT m FROM Movie m LEFT JOIN FETCH m.reviews WHERE m.id = :id")
    Optional<Movie> findByIdWithReviews(@Param("id") Long id);

    // Get average rating for a movie
    @Query("SELECT COALESCE(AVG(CAST(r.rating AS DOUBLE)), 0.0) FROM Review r WHERE r.movie.id = :movieId")
    Double getAverageRatingByMovieId(@Param("movieId") Long movieId);

    // Get review count for a movie
    @Query("SELECT COUNT(r) FROM Review r WHERE r.movie.id = :movieId")
    Long getReviewCountByMovieId(@Param("movieId") Long movieId);

}