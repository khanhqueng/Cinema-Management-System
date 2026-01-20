package com.example.cinema.repository;

import com.example.cinema.entity.Seat;
import com.example.cinema.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Seat Repository - Database operations for seat management
 */
@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    /**
     * Find all seats in a theater ordered by row and seat number
     */
    List<Seat> findByTheaterOrderByRowLetterAscSeatNumberAsc(Theater theater);

    /**
     * Find all active seats in a theater
     */
    List<Seat> findByTheaterAndIsActiveTrueOrderByRowLetterAscSeatNumberAsc(Theater theater);

    /**
     * Find seat by theater, row and seat number
     */
    Optional<Seat> findByTheaterAndRowLetterAndSeatNumber(Theater theater, String rowLetter, Integer seatNumber);

    /**
     * Find seats by theater ID
     */
    @Query("SELECT s FROM Seat s WHERE s.theater.id = :theaterId AND s.isActive = true ORDER BY s.rowLetter ASC, s.seatNumber ASC")
    List<Seat> findActiveSeatsForTheater(@Param("theaterId") Long theaterId);

    /**
     * Find available seats for a specific showtime
     */
    @Query("""
        SELECT s FROM Seat s
        WHERE s.theater.id = :theaterId
        AND s.isActive = true
        AND s.id NOT IN (
            SELECT sb.seat.id FROM SeatBooking sb
            WHERE sb.showtime.id = :showtimeId
            AND sb.status = 'RESERVED'
        )
        ORDER BY s.rowLetter ASC, s.seatNumber ASC
    """)
    List<Seat> findAvailableSeatsForShowtime(@Param("theaterId") Long theaterId, @Param("showtimeId") Long showtimeId);

    /**
     * Find booked seats for a specific showtime
     */
    @Query("""
        SELECT s FROM Seat s
        JOIN SeatBooking sb ON s.id = sb.seat.id
        WHERE sb.showtime.id = :showtimeId
        AND sb.status = 'RESERVED'
        ORDER BY s.rowLetter ASC, s.seatNumber ASC
    """)
    List<Seat> findBookedSeatsForShowtime(@Param("showtimeId") Long showtimeId);

    /**
     * Count total seats in theater
     */
    @Query("SELECT COUNT(s) FROM Seat s WHERE s.theater.id = :theaterId AND s.isActive = true")
    Long countActiveSeatsByTheater(@Param("theaterId") Long theaterId);

    /**
     * Count available seats for showtime
     */
    @Query("""
        SELECT COUNT(s) FROM Seat s
        WHERE s.theater.id = :theaterId
        AND s.isActive = true
        AND s.id NOT IN (
            SELECT sb.seat.id FROM SeatBooking sb
            WHERE sb.showtime.id = :showtimeId
            AND sb.status = 'RESERVED'
        )
    """)
    Long countAvailableSeatsForShowtime(@Param("theaterId") Long theaterId, @Param("showtimeId") Long showtimeId);

    /**
     * Find seats by type in theater
     */
    List<Seat> findByTheaterAndSeatTypeAndIsActiveTrueOrderByRowLetterAscSeatNumberAsc(Theater theater, Seat.SeatType seatType);

    /**
     * Check if seat exists by theater, row and number
     */
    boolean existsByTheaterAndRowLetterAndSeatNumber(Theater theater, String rowLetter, Integer seatNumber);
}