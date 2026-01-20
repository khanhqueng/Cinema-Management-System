package com.example.cinema.repository;

import com.example.cinema.entity.SeatBooking;
import com.example.cinema.entity.Seat;
import com.example.cinema.entity.Showtime;
import com.example.cinema.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * SeatBooking Repository - Database operations for seat booking management
 */
@Repository
public interface SeatBookingRepository extends JpaRepository<SeatBooking, Long> {

    /**
     * Find seat booking by seat and showtime
     */
    Optional<SeatBooking> findBySeatAndShowtime(Seat seat, Showtime showtime);

    /**
     * Find all seat bookings for a specific showtime
     */
    List<SeatBooking> findByShowtimeAndStatusOrderBySeatRowLetterAscSeatSeatNumberAsc(
            Showtime showtime, SeatBooking.SeatBookingStatus status);

    /**
     * Find all active seat bookings for a showtime
     */
    List<SeatBooking> findByShowtimeAndStatus(Showtime showtime, SeatBooking.SeatBookingStatus status);

    /**
     * Find seat bookings for a specific booking
     */
    List<SeatBooking> findByBookingAndStatusOrderBySeatRowLetterAscSeatSeatNumberAsc(
            Booking booking, SeatBooking.SeatBookingStatus status);

    /**
     * Find all seat bookings for a booking
     */
    List<SeatBooking> findByBooking(Booking booking);

    /**
     * Check if seat is booked for showtime
     */
    boolean existsBySeatAndShowtimeAndStatus(Seat seat, Showtime showtime, SeatBooking.SeatBookingStatus status);

    /**
     * Find reserved seats for showtime with seat details
     */
    @Query("""
        SELECT sb FROM SeatBooking sb
        JOIN FETCH sb.seat s
        WHERE sb.showtime.id = :showtimeId
        AND sb.status = 'RESERVED'
        ORDER BY s.rowLetter ASC, s.seatNumber ASC
    """)
    List<SeatBooking> findReservedSeatsForShowtime(@Param("showtimeId") Long showtimeId);

    /**
     * Count reserved seats for showtime
     */
    @Query("SELECT COUNT(sb) FROM SeatBooking sb WHERE sb.showtime.id = :showtimeId AND sb.status = 'RESERVED'")
    Long countReservedSeatsForShowtime(@Param("showtimeId") Long showtimeId);

    /**
     * Find seat bookings by user and showtime
     */
    @Query("""
        SELECT sb FROM SeatBooking sb
        WHERE sb.booking.user.id = :userId
        AND sb.showtime.id = :showtimeId
        AND sb.status = 'RESERVED'
        ORDER BY sb.seat.rowLetter ASC, sb.seat.seatNumber ASC
    """)
    List<SeatBooking> findUserSeatsForShowtime(@Param("userId") Long userId, @Param("showtimeId") Long showtimeId);

    /**
     * Cancel all seat bookings for a booking
     */
    @Query("UPDATE SeatBooking sb SET sb.status = 'CANCELLED', sb.updatedAt = CURRENT_TIMESTAMP WHERE sb.booking.id = :bookingId")
    void cancelSeatBookingsByBookingId(@Param("bookingId") Long bookingId);

    /**
     * Find seat bookings with seat and booking details
     */
    @Query("""
        SELECT sb FROM SeatBooking sb
        JOIN FETCH sb.seat
        JOIN FETCH sb.booking
        WHERE sb.showtime.id = :showtimeId
        AND sb.status = :status
    """)
    List<SeatBooking> findDetailedSeatBookingsForShowtime(@Param("showtimeId") Long showtimeId,
                                                          @Param("status") SeatBooking.SeatBookingStatus status);

    /**
     * Get seat map data for showtime (occupied seats with user info)
     */
    @Query("""
        SELECT sb FROM SeatBooking sb
        JOIN FETCH sb.seat s
        JOIN FETCH sb.booking b
        JOIN FETCH b.user u
        WHERE sb.showtime.id = :showtimeId
        AND sb.status = 'RESERVED'
        ORDER BY s.rowLetter ASC, s.seatNumber ASC
    """)
    List<SeatBooking> getSeatMapForShowtime(@Param("showtimeId") Long showtimeId);
}