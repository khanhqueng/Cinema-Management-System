package com.example.cinema.repository;

import com.example.cinema.entity.Showtime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Showtime Repository - Schedule Management
 * Core showtime operations with availability tracking
 */
@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    // Find by movie
    List<Showtime> findByMovieIdOrderByShowDatetime(Long movieId);
    Page<Showtime> findByMovieIdOrderByShowDatetime(Long movieId, Pageable pageable);

    // Find by theater
    List<Showtime> findByTheaterIdOrderByShowDatetime(Long theaterId);
    Page<Showtime> findByTheaterIdOrderByShowDatetime(Long theaterId, Pageable pageable);

    // Find upcoming showtimes
    @Query("SELECT s FROM Showtime s WHERE s.showDatetime > :currentTime ORDER BY s.showDatetime")
    Page<Showtime> findUpcomingShowtimes(@Param("currentTime") LocalDateTime currentTime, Pageable pageable);

    // Find available showtimes (with seats)
    @Query("SELECT s FROM Showtime s WHERE s.showDatetime > :currentTime AND s.availableSeats > 0 ORDER BY s.showDatetime")
    Page<Showtime> findAvailableShowtimes(@Param("currentTime") LocalDateTime currentTime, Pageable pageable);

    // Find showtimes by date range
    @Query("SELECT s FROM Showtime s WHERE s.showDatetime BETWEEN :startDate AND :endDate ORDER BY s.showDatetime")
    List<Showtime> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate);

    // Find showtimes for specific movie and theater
    @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.theater.id = :theaterId AND s.showDatetime > :currentTime ORDER BY s.showDatetime")
    List<Showtime> findByMovieAndTheater(@Param("movieId") Long movieId,
                                        @Param("theaterId") Long theaterId,
                                        @Param("currentTime") LocalDateTime currentTime);

    // Update available seats (used in booking process)
    @Modifying
    @Query("UPDATE Showtime s SET s.availableSeats = s.availableSeats - :seatsBooked WHERE s.id = :showtimeId AND s.availableSeats >= :seatsBooked")
    int bookSeats(@Param("showtimeId") Long showtimeId, @Param("seatsBooked") Integer seatsBooked);

    @Modifying
    @Query("UPDATE Showtime s SET s.availableSeats = s.availableSeats + :seatsReleased WHERE s.id = :showtimeId")
    int releaseSeats(@Param("showtimeId") Long showtimeId, @Param("seatsReleased") Integer seatsReleased);

    // Check if showtime has capacity for booking
    @Query("SELECT s.availableSeats >= :requiredSeats FROM Showtime s WHERE s.id = :showtimeId")
    Boolean hasCapacityForBooking(@Param("showtimeId") Long showtimeId, @Param("requiredSeats") Integer requiredSeats);

    // Popular showtimes by booking count
    @Query("SELECT s FROM Showtime s " +
           "LEFT JOIN s.bookings b " +
           "WHERE b.bookingStatus = 'CONFIRMED' " +
           "GROUP BY s " +
           "ORDER BY COUNT(b) DESC")
    Page<Showtime> findPopularShowtimes(Pageable pageable);

    // Statistics
    @Query("SELECT COUNT(s) FROM Showtime s WHERE s.showDatetime > :currentTime")
    long countUpcomingShowtimes(@Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT SUM(s.availableSeats) FROM Showtime s WHERE s.showDatetime > :currentTime")
    Long getTotalAvailableSeats(@Param("currentTime") LocalDateTime currentTime);
}