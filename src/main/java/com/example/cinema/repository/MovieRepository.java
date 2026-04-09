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

    // Get movie IDs that have embeddings in Spring AI vector_store
    @Query(value = """
           SELECT m.id
           FROM movies m
           WHERE EXISTS (
              SELECT 1
              FROM vector_store vs
              WHERE vs.metadata IS NOT NULL
                AND vs.metadata::jsonb ->> 'movieId' = m.id::text
           )
           ORDER BY m.id
           """, nativeQuery = true)
    List<Long> findMovieIdsWithEmbeddings();

    // Find movie IDs that need embeddings (for batch processing)
    @Query(value = """
           SELECT m.id
           FROM movies m
           WHERE NOT EXISTS (
              SELECT 1
              FROM vector_store vs
              WHERE vs.metadata IS NOT NULL
                AND vs.metadata::jsonb ->> 'movieId' = m.id::text
           )
           ORDER BY m.id
           """, nativeQuery = true)
    List<Long> findMovieIdsWithoutEmbeddings();

    @Query(value = """
           SELECT EXISTS (
              SELECT 1
              FROM vector_store vs
              WHERE vs.metadata IS NOT NULL
                AND vs.metadata::jsonb ->> 'movieId' = CAST(:movieId AS text)
           )
           """, nativeQuery = true)
    boolean existsEmbeddingByMovieId(@Param("movieId") Long movieId);

    @Query(value = """
           SELECT (vs.metadata::jsonb ->> 'movieId')::bigint AS movie_id
           FROM vector_store vs
           WHERE vs.metadata IS NOT NULL
                                           AND jsonb_exists(vs.metadata::jsonb, 'movieId')
             AND (1 - (vs.embedding <=> CAST(:queryVector AS vector))) >= :threshold
           ORDER BY vs.embedding <=> CAST(:queryVector AS vector)
           LIMIT :limit
           """, nativeQuery = true)
    List<Long> findTopMovieIdsByEmbedding(@Param("queryVector") String queryVector,
                                          @Param("threshold") double threshold,
                                          @Param("limit") int limit);

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
