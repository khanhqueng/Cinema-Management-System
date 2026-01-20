package com.example.cinema.repository;

import com.example.cinema.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Booking Repository - Core Business Logic
 * Essential booking operations with simple business queries
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Find by booking reference
    Optional<Booking> findByBookingReference(String bookingReference);

    // User's booking history
    Page<Booking> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // User's booking history by status
    Page<Booking> findByUserIdAndBookingStatusOrderByCreatedAtDesc(Long userId,
                                                                  Booking.BookingStatus status,
                                                                  Pageable pageable);

    // Find bookings for a specific showtime
    List<Booking> findByShowtimeIdAndBookingStatus(Long showtimeId, Booking.BookingStatus status);

    // Find bookings by status
    Page<Booking> findByBookingStatus(Booking.BookingStatus status, Pageable pageable);

    // Recent bookings
    @Query("SELECT b FROM Booking b WHERE b.createdAt >= :fromDate ORDER BY b.createdAt DESC")
    Page<Booking> findRecentBookings(@Param("fromDate") LocalDateTime fromDate, Pageable pageable);

    // User's upcoming bookings
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.showtime.showDatetime > :currentTime AND b.bookingStatus = 'CONFIRMED' ORDER BY b.showtime.showDatetime")
    List<Booking> findUserUpcomingBookings(@Param("userId") Long userId, @Param("currentTime") LocalDateTime currentTime);

    // Revenue calculations
    @Query("SELECT SUM(b.totalAmount) FROM Booking b WHERE b.bookingStatus = 'CONFIRMED' AND b.createdAt BETWEEN :startDate AND :endDate")
    Optional<BigDecimal> calculateRevenue(@Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);

    // Daily revenue
    @Query("SELECT DATE(b.createdAt) as bookingDate, SUM(b.totalAmount) as dailyRevenue " +
           "FROM Booking b " +
           "WHERE b.bookingStatus = 'CONFIRMED' AND b.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(b.createdAt) " +
           "ORDER BY bookingDate")
    List<Object[]> getDailyRevenue(@Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate);

    // Popular movies by booking count
    @Query("SELECT b.showtime.movie.title, COUNT(b) as bookingCount " +
           "FROM Booking b " +
           "WHERE b.bookingStatus = 'CONFIRMED' AND b.createdAt >= :fromDate " +
           "GROUP BY b.showtime.movie.id, b.showtime.movie.title " +
           "ORDER BY COUNT(b) DESC")
    List<Object[]> findPopularMoviesByBookings(@Param("fromDate") LocalDateTime fromDate, Pageable pageable);

    // Statistics
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingStatus = :status")
    long countByStatus(@Param("status") Booking.BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId AND b.bookingStatus = 'CONFIRMED'")
    long countConfirmedBookingsByUser(@Param("userId") Long userId);

    @Query("SELECT SUM(b.seatsBooked) FROM Booking b WHERE b.bookingStatus = 'CONFIRMED' AND b.createdAt >= :fromDate")
    Optional<Long> getTotalSeatsBooked(@Param("fromDate") LocalDateTime fromDate);

    // Check if user has already booked for showtime (prevent duplicate bookings)
    boolean existsByUserIdAndShowtimeIdAndBookingStatus(Long userId, Long showtimeId, Booking.BookingStatus status);
}